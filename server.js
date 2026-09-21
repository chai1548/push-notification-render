const express = require('express');
const admin = require('firebase-admin');

const app = express();

app.use(express.json());

// Firebase Initialize
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Test route
app.get('/', (req, res) => {
  res.send('Push Backend Running');
});

// Send notification route
// ✅ Admin broadcast (topic) နဲ့ like/comment (per-device token) နှစ်မျိုးစလုံး ကိုင်တွယ်
// - token ပါလာရင် → အဲ့ device တစ်ခုတည်းကို ပို့မယ်
// - token မပါရင် (admin app ရဲ့ မူလ request အတိုင်း) → topic ကို ပို့မယ် (default: all_users)
app.post('/send', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const {
      title,
      message,
      imageUrl,
      clickLink,
      token,
      topic
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: 'Title and message required'
      });
    }

    const payload = {
      data: {
        title: title,
        message: message,
        image: imageUrl || '',
        click_action: clickLink || 'https://google.com',
      },
      android: {
        priority: 'high',
      },
    };

    if (token) {
      // ✅ Like/comment — post owner ရဲ့ device token တစ်ခုတည်းကို ပို့
      payload.token = token;
    } else {
      // ✅ Admin broadcast — မူလအတိုင်း topic ကို ပို့ (backward compatible)
      payload.topic = topic || 'all_users';
    }

    const response = await admin.messaging().send(payload);

    return res.status(200).json({
      success: true,
      messageId: response,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
