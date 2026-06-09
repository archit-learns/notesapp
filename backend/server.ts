import app from './src/app';
import './src/config/redis';

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Modular Layered Server booted cleanly on port ${PORT}`);
});