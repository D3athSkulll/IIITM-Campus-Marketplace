/**
 * Singleton Socket.IO instance holder.
 * Avoids circular-require issues between index.js and controllers.
 */
let _io = null;

const setIO = (io) => { _io = io; };

const getIO = () => {
  if (!_io) throw new Error('Socket.IO is not initialised yet.');
  return _io;
};

module.exports = { setIO, getIO };
