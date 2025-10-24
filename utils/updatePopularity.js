import { db } from "../config/firebase.js";

export const updatePopularity = async (userId, points) => {
  const userRef = db.collection("users").doc(userId);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new Error("User not found");

    const currentScore = userDoc.data().popularityScore || 0;
    transaction.update(userRef, {
      popularityScore: currentScore + points
    });
  });
};
