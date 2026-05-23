const blockDemo = (req, res, next) => {
  if (req.user?.rol !== 'DEMO') return next();
  if (req.method === 'GET') return next();
  const fakeId = `demo-${Date.now()}`;
  return res.status(200).json({
    mensaje: 'Éxito',
    demo: true,
    id: fakeId,
    activo: true,
    nombre: req.body?.nombre || 'Demo',
  });
};

module.exports = blockDemo;
