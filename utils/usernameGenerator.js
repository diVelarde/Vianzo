import { generateUsername } from "unique-username-generator";

export function randomUsername() {
  return generateUsername("", 3, 20); 
}