// controllers/syncController.js
const { Patient, Consultation, Activity, sequelize, Sequelize } = require("../models");

exports.handleSync = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { changes } = req.body;
    const results = [];

    // 1) idMap will track “clientTempId → realId” for any newly‐created Patient
    const idMap = {};

    for (const change of changes) {
      let result;

      switch (change.model) {
        case "Patient":
          result = await handlePatientChange(change, userId, transaction);
          break;

        case "Consultation":
          // Before creating a consultation, rewrite change.data.patientId
          // if it matches a Patient we just inserted (via idMap).
          // Rewrite patientId only if it looks like a temp ID (e.g. "PAT-0001")
           if (typeof change.data.patientId === "string" && change.data.patientId.startsWith("PAT-")) {
            const realId = idMap[change.data.patientId];
            if (!realId) {
              throw new Error(`Unknown tempId for patient: ${change.data.patientId}`);
            }
            change.data.patientId = realId; // 👈 no toString() — leave it as number
            } 

          result = await handleConsultationChange(change, userId, transaction);
          break;

        case "Activity":
          result = await handleActivityChange(change, userId, transaction);
          break;

        default:
          throw new Error(`Unknown model: ${change.model}`);
      }

      // 2) If this was a “create Patient,” store its real ID in idMap
      if (result.model === "Patient" && result.type === "create") {
        // result.tempId is the client’s tempId, result.id is the new DB ID
        idMap[result.tempId] = parseInt(result.id, 10);
      }

      results.push(result);
    }

    await transaction.commit();
    return res.json({ success: true, results });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ── PATIENT HANDLER ─────────────────────────────────────────────────────────────
const handlePatientChange = async (change, userId, transaction) => {
  const { type, data, tempId } = change;

  switch (type) {
    case "create": {
      // Pull out clientTempId, plus these fields:
      // ‣ data.name, data.gender, data.village, data.phoneNumber, data.dateOfBirth, etc.
      const {
        id: clientTempId,
        name,
        gender,
        village,       // client→“village” → DB→“location”
        phoneNumber,   // client→“phoneNumber” → DB→“contact”
        dateOfBirth,   // client→“dateOfBirth” → DB→“date_of_birth”
        ...extraFields // stash everything else in details JSON
      } = data;

      // (Optionally) compute age from dateOfBirth
      let computedAge = null;
      if (dateOfBirth) {
        const dob = new Date(dateOfBirth);
        computedAge = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365));
      }

      // Build a payload that exactly matches your DB columns
      const payload = {
        name,
        gender,
        location: village || null,
        contact: phoneNumber || null,
        date_of_birth: dateOfBirth || null,
        age: computedAge,
        last_updated: new Date(),
        user_id: userId,
        details: extraFields  // store any other fields in a JSON column
      };

      const patient = await Patient.create(payload, { transaction });

      return {
        model: "Patient",
        type: "create",
        tempId: clientTempId,
        id: patient.id.toString()
      };
    }

    case "update": {
      const {
        id: patientId,
        name,
        gender,
        village,
        phoneNumber,
        dateOfBirth,
        ...extraFields
      } = data;

      let computedAge = null;
      if (dateOfBirth) {
        const dob = new Date(dateOfBirth);
        computedAge = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365));
      }

      const payload = {
        name,
        gender,
        location: village || null,
        contact: phoneNumber || null,
        date_of_birth: dateOfBirth || null,
        age: computedAge,
        last_updated: new Date(),
        user_id: userId,
        details: extraFields
      };

      const [affectedRows] = await Patient.update(payload, {
        where: {
          id: data.id,
          user_id: userId,
          last_updated: { [Sequelize.Op.lte]: data.last_updated }
        },
        transaction
      });

      if (affectedRows === 0) throw new Error("Patient update conflict");
      return { model: "Patient", type: "update", id: data.id };
    }

    case "delete": {
      await Patient.destroy({
        where: { id: data.id, user_id: userId },
        transaction
      });
      return { model: "Patient", type: "delete", id: data.id };
    }

    default:
      throw new Error(`Unknown change type: ${type}`);
  }
};

// ── CONSULTATION HANDLER ─────────────────────────────────────────────────────────
const handleConsultationChange = async (change, userId, transaction) => {
  const { type, data, tempId } = change;

  switch (type) {
    case "create": {
      // Pull out fields client sent:
      // ‣ data.patientId (which we already rewrote above if it matched idMap)
      // ‣ data.symptoms → DB→notes
      // ‣ data.status
      // Everything else goes into details JSON.
      const {
        id: clientTempId,
        patientId,
        symptoms,
        status,
        ...extraFields
      } = data;

      const validStatuses = ['pending', 'completed', 'cancelled'];
      const payload = {
        patient_id: Number(patientId),
        notes: symptoms || null,
        last_updated: new Date(),
        chw_id: userId,
        details: extraFields,
        ...(validStatuses.includes(status) && { status }),
      };

      const consultation = await Consultation.create(payload, { transaction });
      return {
        model: "Consultation",
        type: "create",
        tempId: clientTempId,
        id: consultation.id.toString()
      };
    }

    case "update": {
      const {
        id: consultationId,
        patientId,
        symptoms,
        status,
        ...extraFields
      } = data;

      const payload = {
        patient_id: parseInt(patientId, 10),
        notes: symptoms || null,
        status: status || null,
        last_updated: new Date(),
        chw_id: userId,
        details: extraFields
      };

      const [affectedRows] = await Consultation.update(payload, {
        where: {
          id: consultationId,
          chw_id: userId,
          last_updated: { [Sequelize.Op.lte]: data.last_updated }
        },
        transaction
      });
      if (affectedRows === 0) throw new Error("Consultation update conflict");
      return { model: "Consultation", type: "update", id: consultationId };
    }

    case "delete": {
      await Consultation.destroy({
        where: { id: data.id, chw_id: userId },
        transaction
      });
      return { model: "Consultation", type: "delete", id: data.id };
    }

    default:
      throw new Error(`Unknown change type: ${type}`);
  }
};

// ── ACTIVITY HANDLER ─────────────────────────────────────────────────────────────
const handleActivityChange = async (change, userId, transaction) => {
  const { type, data, tempId } = change;

  switch (type) {
    case "create": {
      const {
        id: clientTempId,
        message,
        type: activityType,
        patientId,
        read,
        ...extraFields
      } = data;

      const payload = {
        message: message || null,
        type: activityType || null,
        patient_id: patientId ? parseInt(patientId, 10) : null,
        read: read === true,
        last_updated: new Date(),
        user_id: userId,
        details: extraFields
      };

      const activity = await Activity.create(payload, { transaction });
      return {
        model: "Activity",
        type: "create",
        tempId: clientTempId,
        id: activity.id.toString()
      };
    }

    case "update": {
      const {
        id: activityId,
        message,
        type: activityType,
        patientId,
        read,
        ...extraFields
      } = data;

      const payload = {
        message: message || null,
        type: activityType || null,
        patient_id: patientId ? parseInt(patientId, 10) : null,
        read: read === true,
        last_updated: new Date(),
        user_id: userId,
        details: extraFields
      };

      const [affectedRows] = await Activity.update(payload, {
        where: {
          id: activityId,
          user_id: userId,
          last_updated: { [Sequelize.Op.lte]: data.last_updated }
        },
        transaction
      });
      if (affectedRows === 0) throw new Error("Activity update conflict");
      return { model: "Activity", type: "update", id: activityId };
    }

    case "delete": {
      await Activity.destroy({
        where: { id: data.id, user_id: userId },
        transaction
      });
      return { model: "Activity", type: "delete", id: data.id };
    }

    default:
      throw new Error(`Unknown change type: ${type}`);
  }
};
