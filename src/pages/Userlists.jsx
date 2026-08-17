/* =========================
   CONSOLIDATION SCHEMA
========================= */
const consolidationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female"] },
    age: { type: Number },
    address: { type: String },
    contactNo: { type: String },
    cellgroupLeader: { type: String },
    status: { type: String, enum: ["Active", "Inactive", "Pending"], default: "Active" },
    OVE: { type: Boolean, default: false },
    Assurance: { type: Boolean, default: false },
    Repentance: { type: Boolean, default: false },
    Lordship: { type: Boolean, default: false },
    Forgiveness: { type: Boolean, default: false },
    '4 Greatest Meetings': { type: Boolean, default: false },
    Devotion: { type: Boolean, default: false },
    Prayer: { type: Boolean, default: false },
    'Witnessing Testimony': { type: Boolean, default: false },
    'Life of Obedience': { type: Boolean, default: false },
    'Life in Church': { type: Boolean, default: false }
  },
  { timestamps: true, collection: "consolidation" }
);

const Consolidation = mongoose.model("Consolidation", consolidationSchema);

/* =========================
   CONSOLIDATION ENDPOINTS
========================= */

// CREATE CONSOLIDATION RECORD
app.post("/api/consolidation", async (req, res) => {
  try {
    const record = new Consolidation(req.body);
    const savedRecord = await record.save();

    res.status(201).json({
      success: true,
      message: "Consolidation record created successfully",
      data: savedRecord,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// BATCH CREATE CONSOLIDATION RECORDS
app.post("/api/consolidation/batch", async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of records",
      });
    }

    const savedRecords = await Consolidation.insertMany(records);

    res.status(201).json({
      success: true,
      message: `${savedRecords.length} consolidation records created successfully`,
      data: savedRecords,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// GET ALL CONSOLIDATION RECORDS
app.get("/api/consolidation", async (req, res) => {
  try {
    const records = await Consolidation.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// GET CONSOLIDATION RECORD BY ID
app.get("/api/consolidation/:id", async (req, res) => {
  try {
    const record = await Consolidation.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Consolidation record not found",
      });
    }
    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// UPDATE CONSOLIDATION RECORD
app.put("/api/consolidation/:id", async (req, res) => {
  try {
    const updatedRecord = await Consolidation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: "Consolidation record not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Consolidation record updated successfully",
      data: updatedRecord,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// DELETE CONSOLIDATION RECORD
app.delete("/api/consolidation/:id", async (req, res) => {
  try {
    const deletedRecord = await Consolidation.findByIdAndDelete(req.params.id);
    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        message: "Consolidation record not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Consolidation record deleted successfully",
      data: deletedRecord,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
