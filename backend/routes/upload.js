import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, "../uploads/logos");
const imagesDir = path.join(__dirname, "../uploads/images");
const cvsDir = path.join(__dirname, "../uploads/cvs");
const filesDir = path.join(__dirname, "../uploads/files");
const certificatesDir = path.join(__dirname, "../uploads/certificates");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

if (!fs.existsSync(cvsDir)) {
  fs.mkdirSync(cvsDir, { recursive: true });
}

if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
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

// Helper function to calculate file hash
const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (error) => reject(error));
  });
};

// Helper function to check if file with same hash exists
const findDuplicateFile = async (uploadedFilePath, targetDir) => {
  try {
    const uploadedHash = await calculateFileHash(uploadedFilePath);
    const files = fs.readdirSync(targetDir);
    
    for (const file of files) {
      const existingFilePath = path.join(targetDir, file);
      if (existingFilePath === uploadedFilePath) continue;
      
      try {
        const existingHash = await calculateFileHash(existingFilePath);
        if (existingHash === uploadedHash) {
          return `/uploads/cvs/${file}`;
        }
      } catch (err) {
        // Skip files that can't be read
        continue;
      }
    }
    return null;
  } catch (error) {
    console.error('Error checking for duplicate:', error);
    return null;
  }
};

// Upload CV endpoint
router.post("/cv", cvUpload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const uploadedFilePath = req.file.path;
    const filePath = `/uploads/cvs/${req.file.filename}`;
    
    // Check if a file with the same content already exists
    const duplicateFilePath = await findDuplicateFile(uploadedFilePath, cvsDir);
    
    if (duplicateFilePath) {
      // Delete the newly uploaded file since it's a duplicate
      fs.unlinkSync(uploadedFilePath);
      
      console.log("⚠️ Duplicate CV detected, returning existing file:", duplicateFilePath);
      
      return res.status(200).json({
        success: true,
        message: "CV already exists",
        filePath: duplicateFilePath,
        isDuplicate: true
      });
    }
    
    console.log("✅ CV uploaded:", filePath);

    res.status(200).json({
      success: true,
      message: "CV uploaded successfully",
      filePath: filePath,
      isDuplicate: false
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload CV"
    });
  }
});

// Configure multer for general file uploads (task submissions)
const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, filesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, 'submission-' + uniqueSuffix + '-' + safeName);
  }
});

// File filter for general files
const generalFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|zip|rar|txt|jpg|jpeg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type not allowed. Allowed: PDF, DOC, DOCX, ZIP, RAR, TXT, JPG, PNG'));
  }
};

const fileUpload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: generalFileFilter
});

// Upload general file endpoint (for task submissions)
router.post("/file", fileUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const filePath = `/uploads/files/${req.file.filename}`;
    
    console.log("✅ File uploaded:", filePath);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      filePath: filePath
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload file"
    });
  }
});

// Configure multer for certificate uploads
const certificateStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, certificatesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'certificate-' + uniqueSuffix + ext);
  }
});

// File filter for certificates
const certificateFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|jpg|jpeg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /pdf|jpeg|jpg|png/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, and PNG files are allowed for certificates!'));
  }
};

const certificateUpload = multer({
  storage: certificateStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: certificateFileFilter
});

// Upload certificate endpoint
router.post("/certificate", certificateUpload.single('certificate'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const certificatePath = `/uploads/certificates/${req.file.filename}`;
    
    console.log("✅ Certificate uploaded:", certificatePath);

    res.status(200).json({
      success: true,
      message: "Certificate uploaded successfully",
      certificatePath: certificatePath
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload certificate"
    });
  }
});

export default router;
