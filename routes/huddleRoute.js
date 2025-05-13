// const express = require('express');
// const router = express.Router();
// const auth = require("../middleware/authMiddleware");
// const Forum = require('../models/forum'); // Your Forum model
// const { AccessToken, Role } = require('@huddle01/server-sdk/auth'); // Ensure this is imported

// // Store active rooms (in-memory for now, could be moved to database)
// const activeSpaces = new Map();

// // Create room endpoint (modified)
// router.post('/api/huddle/create-room', auth, async (req, res) => {
//   try {
//     console.log('POST /api/huddle/create-room - Request body:', req.body);
//     console.log('User ID from auth:', req.user.id);

//     if (!process.env.HUDDLE01_API_KEY) {
//       throw new Error('Huddle01 API key not configured');
//     }
//     console.log('Huddle01 API Key exists:', !!process.env.HUDDLE01_API_KEY);

//     const { forumId } = req.body;
//     console.log('Forum ID:', forumId);
    
//     // Check if forum exists and user is creator
//     if (forumId) {
//       const forum = await Forum.findById(forumId);
//       console.log('Forum found:', forum ? forum.toObject() : null);
      
//       if (!forum) {
//         return res.status(404).json({ 
//           success: false, 
//           error: 'Forum not found' 
//         });
//       }
      
//       if (forum.creator.toString() !== req.user.id) {
//         console.log('Permission check failed - Creator:', forum.creator.toString(), 'User:', req.user.id);
//         return res.status(403).json({ 
//           success: false, 
//           error: 'Only forum creator can start an audio space' 
//         });
//       }
//     }

//     console.log('Making Huddle01 create-room API call...');
//     const response = await fetch('https://api.huddle01.com/api/v2/sdk/rooms/create-room', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'x-api-key': process.env.HUDDLE01_API_KEY,
//       },
//       body: JSON.stringify({
//         title: 'Forum Audio Space',
//         roomLocked: false, // Make it false so anyone can join
//       }),
//     });

//     console.log('Huddle01 API response status:', response.status);
//     if (!response.ok) {
//       const errorText = await response.text();
//       console.log('Huddle01 API error response:', errorText);
//       throw new Error(`API responded with ${response.status}: ${errorText}`);
//     }

//     const data = await response.json();
//     console.log('Huddle01 API response data:', data);
    
//     if (!data.data?.roomId) {
//       throw new Error('Invalid response from Huddle01 API - No roomId');
//     }

//     // Store active space info
//     if (forumId) {
//       const spaceInfo = {
//         roomId: data.data.roomId,
//         createdAt: new Date(),
//         createdBy: req.user.id
//       };
//       activeSpaces.set(forumId, spaceInfo);
//       console.log('Stored in activeSpaces:', { forumId, spaceInfo });
      
//       // Update forum document if needed
//       const updatedForum = await Forum.findByIdAndUpdate(
//         forumId,
//         {
//           'space.isActive': true,
//           'space.roomId': data.data.roomId
//         },
//         { new: true }
//       );
//       console.log('Updated forum document:', updatedForum ? updatedForum.toObject() : null);
//     }

//     res.json({ 
//       success: true,
//       roomId: data.data.roomId 
//     });
//     console.log('Response sent:', { success: true, roomId: data.data.roomId });
//   } catch (error) {
//     console.error('Error creating Huddle01 room:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Failed to create audio room',
//       details: error.message 
//     });
//   }
// });

// // Get space status endpoint
// router.get('/api/huddle/space-status/:forumId', auth, async (req, res) => {
//   try {
//     const { forumId } = req.params;
//     console.log('GET /api/huddle/space-status - Forum ID:', forumId);
    
//     if (!forumId) {
//       return res.status(400).json({
//         success: false,
//         error: 'Forum ID is required'
//       });
//     }
    
//     // First check in-memory map
//     if (activeSpaces.has(forumId)) {
//       const spaceInfo = activeSpaces.get(forumId);
//       console.log('Found in activeSpaces:', spaceInfo);
//       return res.json({
//         active: true,
//         roomId: spaceInfo.roomId
//       });
//     }
    
//     // If not in memory, check database
//     console.log('Checking database for forum:', forumId);
//     const forum = await Forum.findById(forumId);
//     console.log('Forum from DB:', forum ? forum.toObject() : null);
    
//     if (!forum) {
//       return res.status(404).json({
//         success: false,
//         error: 'Forum not found'
//       });
//     }
    
//     if (forum.space && forum.space.isActive && forum.space.roomId) {
//       const spaceInfo = {
//         roomId: forum.space.roomId,
//         createdAt: new Date(),
//         createdBy: forum.creator
//       };
//       activeSpaces.set(forumId, spaceInfo);
//       console.log('Updated activeSpaces from DB:', spaceInfo);
      
//       return res.json({
//         active: true,
//         roomId: forum.space.roomId
//       });
//     }
    
//     console.log('No active space found for forum:', forumId);
//     return res.json({
//       active: false
//     });
    
//   } catch (error) {
//     console.error('Error checking space status:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to check space status',
//       details: error.message
//     });
//   }
// });

// // Modified get-token endpoint to work for all users
// router.get('/api/huddle/get-token', auth, async (req, res) => {
//   const { roomId } = req.query;
//   console.log('GET /api/huddle/get-token - Query:', req.query);

//   if (!roomId) {
//     return res.status(400).json({ 
//       success: false,
//       error: 'roomId query parameter is required' 
//     });
//   }

//   try {
//     console.log('Huddle01 API Key exists:', !!process.env.HUDDLE01_API_KEY);
//     if (!process.env.HUDDLE01_API_KEY) {
//       throw new Error('Huddle01 API key not configured');
//     }

//     // Check if requesting user is a forum creator to determine role
//     let isCreator = false;
//     let forumId = null;
//     console.log('User ID from auth:', req.user.id);
    
//     // Find the forum associated with this roomId
//     for (const [fId, spaceInfo] of activeSpaces.entries()) {
//       if (spaceInfo.roomId === roomId) {
//         forumId = fId;
//         isCreator = spaceInfo.createdBy.toString() === req.user.id;
//         break;
//       }
//     }
//     console.log('Checked activeSpaces - Forum ID:', forumId, 'Is Creator:', isCreator);

//     // If not found in memory, check the database
//     if (!forumId) {
//       const forum = await Forum.findOne({ 'space.roomId': roomId });
//       console.log('Forum from DB for roomId:', forum ? forum.toObject() : null);
//       if (forum) {
//         isCreator = forum.creator.toString() === req.user.id;
//       }
//     }
//     console.log('Final role determination - Is Creator:', isCreator);

//     const accessToken = new AccessToken({
//       apiKey: process.env.HUDDLE01_API_KEY,
//       roomId: roomId.toString(),
//       role: isCreator ? Role.HOST : Role.GUEST,
//       permissions: {
//         admin: isCreator, // Only creator gets admin permissions
//         canConsume: true,
//         canProduce: true,
//         canProduceSources: {
//           cam: false, // Disable camera since we only want audio
//           mic: true,
//           screen: false,
//         },
//         canRecvData: true,
//         canSendData: true,
//         canUpdateMetadata: true,
//       }
//     });

//     const token = await accessToken.toJwt();
//     console.log('Generated access token:', token);
    
//     res.json({ 
//       success: true,
//       token 
//     });
//     console.log('Response sent:', { success: true, token });
//   } catch (error) {
//     console.error('Error generating Huddle01 token:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Failed to generate access token',
//       details: error.message 
//     });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Forum = require('../models/forum'); // Your Forum model
const { AccessToken, Role } = require('@huddle01/server-sdk/auth'); // Ensure this is imported

// Store active rooms (in-memory for now, could be moved to database)
const activeSpaces = new Map();

// Create room endpoint (modified)
router.post('/api/huddle/create-room', auth, async (req, res) => {
  try {
    console.log('POST /api/huddle/create-room - Request body:', req.body);
    console.log('User ID from auth:', req.user.id);

    if (!process.env.HUDDLE01_API_KEY) {
      throw new Error('Huddle01 API key not configured');
    }
    console.log('Huddle01 API Key exists:', !!process.env.HUDDLE01_API_KEY);

    const { forumId } = req.body;
    console.log('Forum ID:', forumId);
    
    // Check if forum exists and user is creator
    if (forumId) {
      const forum = await Forum.findById(forumId);
      console.log('Forum found:', forum ? forum.toObject() : null);
      
      if (!forum) {
        return res.status(404).json({ 
          success: false, 
          error: 'Forum not found' 
        });
      }
      
      if (forum.creator.toString() !== req.user.id) {
        console.log('Permission check failed - Creator:', forum.creator.toString(), 'User:', req.user.id);
        return res.status(403).json({ 
          success: false, 
          error: 'Only forum creator can start an audio space' 
        });
      }
    }

    console.log('Making Huddle01 create-room API call...');
    const response = await fetch('https://api.huddle01.com/api/v2/sdk/rooms/create-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.HUDDLE01_API_KEY,
      },
      body: JSON.stringify({
        title: 'Forum Audio Space',
        roomLocked: false, // Make it false so anyone can join
      }),
    });

    console.log('Huddle01 API response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Huddle01 API error response:', errorText);
      throw new Error(`API responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Huddle01 API response data:', data);
    
    if (!data.data?.roomId) {
      throw new Error('Invalid response from Huddle01 API - No roomId');
    }

    // Store active space info
    if (forumId) {
      const spaceInfo = {
        roomId: data.data.roomId,
        createdAt: new Date(),
        createdBy: req.user.id
      };
      activeSpaces.set(forumId, spaceInfo);
      console.log('Stored in activeSpaces:', { forumId, spaceInfo });
      
      // Update forum document if needed
      const updatedForum = await Forum.findByIdAndUpdate(
        forumId,
        {
          'space.isActive': true,
          'space.roomId': data.data.roomId
        },
        { new: true }
      );
      console.log('Updated forum document:', updatedForum ? updatedForum.toObject() : null);

      // Emit socket event
      const io = req.app.get('io');
      if (io && forumId) {
        io.to(forumId).emit('spaceStatusChanged', { 
          active: true, 
          roomId: data.data.roomId 
        });
        console.log(`Emitted spaceStatusChanged for forum ${forumId}`);
      }
    }

    res.json({ 
      success: true,
      roomId: data.data.roomId 
    });
    console.log('Response sent:', { success: true, roomId: data.data.roomId });
  } catch (error) {
    console.error('Error creating Huddle01 room:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create audio room',
      details: error.message 
    });
  }
});

// Get space status endpoint
router.get('/api/huddle/space-status/:forumId', auth, async (req, res) => {
  try {
    const { forumId } = req.params;
    console.log('GET /api/huddle/space-status - Forum ID:', forumId);
    
    if (!forumId) {
      return res.status(400).json({
        success: false,
        error: 'Forum ID is required'
      });
    }
    
    // First check in-memory map
    if (activeSpaces.has(forumId)) {
      const spaceInfo = activeSpaces.get(forumId);
      console.log('Found in activeSpaces:', spaceInfo);
      return res.json({
        active: true,
        roomId: spaceInfo.roomId
      });
    }
    
    // If not in memory, check database
    console.log('Checking database for forum:', forumId);
    const forum = await Forum.findById(forumId);
    console.log('Forum from DB:', forum ? forum.toObject() : null);
    
    if (!forum) {
      return res.status(404).json({
        success: false,
        error: 'Forum not found'
      });
    }
    
    if (forum.space && forum.space.isActive && forum.space.roomId) {
      const spaceInfo = {
        roomId: forum.space.roomId,
        createdAt: new Date(),
        createdBy: forum.creator
      };
      activeSpaces.set(forumId, spaceInfo);
      console.log('Updated activeSpaces from DB:', spaceInfo);
      
      return res.json({
        active: true,
        roomId: forum.space.roomId
      });
    }
    
    console.log('No active space found for forum:', forumId);
    return res.json({
      active: false
    });
    
  } catch (error) {
    console.error('Error checking space status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check space status',
      details: error.message
    });
  }
});

// Modified get-token endpoint to work for all users
router.get('/api/huddle/get-token', auth, async (req, res) => {
  const { roomId } = req.query;
  console.log('GET /api/huddle/get-token - Query:', req.query);

  if (!roomId) {
    return res.status(400).json({ 
      success: false,
      error: 'roomId query parameter is required' 
    });
  }

  try {
    console.log('Huddle01 API Key exists:', !!process.env.HUDDLE01_API_KEY);
    if (!process.env.HUDDLE01_API_KEY) {
      throw new Error('Huddle01 API key not configured');
    }

    // Check if requesting user is a forum creator to determine role
    let isCreator = false;
    let forumId = null;
    console.log('User ID from auth:', req.user.id);
    
    // Find the forum associated with this roomId
    for (const [fId, spaceInfo] of activeSpaces.entries()) {
      if (spaceInfo.roomId === roomId) {
        forumId = fId;
        isCreator = spaceInfo.createdBy.toString() === req.user.id;
        break;
      }
    }
    console.log('Checked activeSpaces - Forum ID:', forumId, 'Is Creator:', isCreator);

    // If not found in memory, check the database
    if (!forumId) {
      const forum = await Forum.findOne({ 'space.roomId': roomId });
      console.log('Forum from DB for roomId:', forum ? forum.toObject() : null);
      if (forum) {
        isCreator = forum.creator.toString() === req.user.id;
      }
    }
    console.log('Final role determination - Is Creator:', isCreator);

    const accessToken = new AccessToken({
      apiKey: process.env.HUDDLE01_API_KEY,
      roomId: roomId.toString(),
      role: isCreator ? Role.HOST : Role.GUEST,
      permissions: {
        admin: isCreator, // Only creator gets admin permissions
        canConsume: true,
        canProduce: true,
        canProduceSources: {
          cam: false, // Disable camera since we only want audio
          mic: true,
          screen: false,
        },
        canRecvData: true,
        canSendData: true,
        canUpdateMetadata: true,
      }
    });

    const token = await accessToken.toJwt();
    console.log('Generated access token:', token);
    
    res.json({ 
      success: true,
      token 
    });
    console.log('Response sent:', { success: true, token });
  } catch (error) {
    console.error('Error generating Huddle01 token:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate access token',
      details: error.message 
    });
  }
});

// Add new endpoint to notify when space is manually ended
router.post('/api/huddle/end-space/:forumId', auth, async (req, res) => {
  try {
    const { forumId } = req.params;
    const io = req.app.get('io');
    
    console.log('POST /api/huddle/end-space - Forum ID:', forumId);
    console.log('User ID from auth:', req.user.id);
    
    // Verify user is creator
    const forum = await Forum.findById(forumId);
    if (!forum || forum.creator.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only forum creator can end the audio space' 
      });
    }

    // Remove from active spaces
    activeSpaces.delete(forumId);
    
    // Update forum document
    await Forum.findByIdAndUpdate(
      forumId,
      {
        'space.isActive': false,
        'space.roomId': null
      }
    );

    // Notify all clients
    if (io) {
      io.to(forumId).emit('spaceStatusChanged', { 
        active: false 
      });
      console.log(`Emitted spaceStatusChanged (ended) for forum ${forumId}`);
    }

    res.json({ 
      success: true,
      message: 'Audio space ended successfully'
    });

  } catch (error) {
    console.error('Error ending space:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to end audio space',
      details: error.message 
    });
  }
});

module.exports = router;