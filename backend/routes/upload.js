import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, "../uploads/logos");
const imagesDir = path.join(__dirname, "../uploads/images");
const cvsDir = path.join(__dirname, "../uploads/cvs");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

if (!fs.existsSync(cvsDir)) {
  fs.mkdirSync(cvsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

// Configure multer for general images
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

// Upload logo endpoint
router.post("/logo", upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    // Return the file path
    const logoPath = `/uploads/logos/${req.file.filename}`;
    
    console.log("✅ Logo uploaded:", logoPath);

    res.status(200).json({
      success: true,
      message: "Logo uploaded successfully",
      logoPath: logoPath
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload logo"
    });
  }
});

// Upload general image endpoint
router.post("/image", imageUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    // Return the file path
    const filePath = `/uploads/images/${req.file.filename}`;
    
    console.log("✅ Image uploaded:", filePath);

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      filePath: filePath
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image"
    });
  }
});

// Configure multer for CV files
const cvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, cvsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'cv-' + uniqueSuffix + ext);
  }
});

// File filter for CV files
const cvFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed!'));
  }
};

const cvUpload = multer({
  storage: cvStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: cvFileFilter
});

// Upload CV endpoint
router.post("/cv", cvUpload.single('cv'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    // Return the file path
    const filePath = `/uploads/cvs/${req.file.filename}`;
    
    console.log("✅ CV uploaded:", filePath);

    res.status(200).json({
      success: true,
      message: "CV uploaded successfully",
      filePath: filePath
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload CV"
    });
  }
});

export default router;
