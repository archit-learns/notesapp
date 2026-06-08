import app from './src/app';

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Modular Layered Server booted cleanly on port ${PORT}`);
});