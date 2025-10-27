const path = require('path');
const fs = require('fs');

const viewEvidence = async (req, res, next) => {
  try {
    const { jobId, submissionId, filename } = req.params;
    
    const artifactsDir = path.join(__dirname, '../../../../automation/artifacts');
    const filePath = path.join(artifactsDir, jobId, submissionId, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.html') {
      res.setHeader('Content-Type', 'text/html');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    }
    
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
};

module.exports = { viewEvidence };
