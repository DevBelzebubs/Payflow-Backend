const exhibitionMode = (req, res, next) => {
  if (process.env.EXHIBITION_MODE === 'true') {
    return res.status(403).json({
      error: 'El sistema está en modo exhibición. Las escrituras están deshabilitadas.'
    });
  }
  next();
};

module.exports = exhibitionMode;
