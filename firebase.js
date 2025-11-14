const firebaseConfig = {
  apiKey: "AIzaSyApdnTXHE7O6AoU9ldEV4yzsCVBGdsWuRg",
  authDomain: "web-appsmart-technology.firebaseapp.com",
  projectId: "web-appsmart-technology",
  storageBucket: "web-appsmart-technology.appspot.com",
  messagingSenderId: "595885713972",
  appId: "1:595885713972:web:9ab9dd4072db0101207861"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
