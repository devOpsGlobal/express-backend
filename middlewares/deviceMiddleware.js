// const deviceMiddleware = (() => {
//   const deviceMap = new Map();
//   const blacklistedIPs = new Set();

//   return {
//     deviceTracker: (req, res, next) => {
//       try {
//         const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

//         const generateUserId = () => {
//           const randomNum = Math.floor(100 + Math.random() * 900); // Generates 3-digit number (100-999)
//           return `#U${randomNum}`;
//         };

//         // In your middleware:
//         const userId = generateUserId();

//         if (blacklistedIPs.has(ip)) {
//           return res.status(403).json({ error: 'Access Denied', message: 'Your IP address has been blocked' });
//         }

//         if (!deviceMap.has(ip)) {
//           deviceMap.set(ip, { userId, firstSeen: new Date(), lastSeen: new Date(), count: 1 });
//           console.log(`📡 New connection from IP: ${ip} (User: ${userId})`);
//         } else {
//           const info = deviceMap.get(ip);
//           info.lastSeen = new Date();
//           info.count++;
//         }

//         req.clientIp = ip;
//         next();
//       } catch (err) {
//         console.error('⚠️ Device tracking error:', err);
//         next(err);
//       }
//     },

//     getDevices: () => {
//       return Array.from(deviceMap.entries()).map(([ip, data]) => ({
//         ip,
//         ...data
//       }));
//     },

//     blockIP: (ip) => {
//       blacklistedIPs.add(ip);
//       deviceMap.delete(ip);
//       return { success: true, message: `IP ${ip} blocked` };
//     },

//     unblockIP: (ip) => {
//       blacklistedIPs.delete(ip);
//       return { success: true, message: `IP ${ip} unblocked` };
//     },

//     errorHandler: (err, req, res, next) => {
//       console.error('🚨 Middleware Error:', err.stack);
//       res.status(500).json({
//         error: 'Connection Error',
//         message: 'There was an issue processing your request',
//         details: process.env.NODE_ENV === 'development' ? err.message : undefined
//       });
//     }
//   };
// })();

// module.exports = deviceMiddleware;
