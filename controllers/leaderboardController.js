import { db } from "../config/firebase.js";

// Utility to calculate score (can be tweaked later)
const calculateScore = (postsCount, commentsCount, reactionsCount) => {
  return postsCount * 3 + commentsCount * 2 + reactionsCount; 
};

// Get top users ranked by activity
export const getLeaderboard = async (req, res) => {
  try {
    const usersSnap = await db.collection("users").get();

    const leaderboard = [];

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;

      // Count posts by this user
      const postsSnap = await db.collection("posts").where("userId", "==", userId).get();
      const postsCount = postsSnap.size;

      // Count comments by this user
      const commentsSnap = await db.collectionGroup("comments").where("userId", "==", userId).get();
      const commentsCount = commentsSnap.size;

      // Count reactions by this user
      const reactionsSnap = await db.collectionGroup("reactions").where("userId", "==", userId).get();
      const reactionsCount = reactionsSnap.size;

      const score = calculateScore(postsCount, commentsCount, reactionsCount);

      leaderboard.push({
        userId,
        username: userDoc.data().username,
        postsCount,
        commentsCount,
        reactionsCount,
        score,
      });
    }

    // Sort by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get specific user's rank
export const getUserRank = async (req, res) => {
  try {
    const { userId } = req.params;

    // Reuse leaderboard logic
    const usersSnap = await db.collection("users").get();
    const leaderboard = [];

    for (const userDoc of usersSnap.docs) {
      const uId = userDoc.id;
      const postsSnap = await db.collection("posts").where("userId", "==", uId).get();
      const commentsSnap = await db.collectionGroup("comments").where("userId", "==", uId).get();
      const reactionsSnap = await db.collectionGroup("reactions").where("userId", "==", uId).get();

      const score = calculateScore(postsSnap.size, commentsSnap.size, reactionsSnap.size);

      leaderboard.push({ userId: uId, username: userDoc.data().username, score });
    }

    leaderboard.sort((a, b) => b.score - a.score);

    const rank = leaderboard.findIndex((u) => u.userId === userId) + 1;
    const user = leaderboard.find((u) => u.userId === userId);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found in leaderboard" });
    }

    res.json({ success: true, rank, user });
  } catch (err) {
    console.error("Error fetching user rank:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
