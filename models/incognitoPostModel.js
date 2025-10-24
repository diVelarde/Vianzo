import { db } from "../config/firebase.js";
import { collection } from "firebase/firestore";

// Reference to the "incognitoPosts" collection
const IncognitoPost = db.collection("incognitoPosts");

export default IncognitoPost;
