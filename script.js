// Firebase setup
const firebaseConfig = {
  apiKey: "AIzaSyCU0DPn6MPJ_YM_huCzrFo8v6dO-8d-OV8",
  authDomain: "the-great-wall-of-memes.firebaseapp.com",
  databaseURL: "https://the-great-wall-of-memes-default-rtdb.firebaseio.com",
  projectId: "the-great-wall-of-memes",
  storageBucket: "the-great-wall-of-memes.firebasestorage.app",
  messagingSenderId: "601620604118",
  appId: "1:601620604118:web:42b3897dcb2c764a261577"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM elements
const grid = document.getElementById("grid");
const formModal = document.getElementById("formModal");
const buyForm = document.getElementById("buyForm");
const soldPixels = new Set();
let startX, startY, width, height;

// Create grid
for (let i = 0; i < 10000; i++) {
  const pixel = document.createElement("div");
  pixel.className = "pixel";
  pixel.dataset.index = i;

  pixel.addEventListener("click", () => {
    if (soldPixels.has(i)) return;

    startX = i % 100;
    startY = Math.floor(i / 100);
    document.getElementById("pixelIdDisplay").innerText = i;
    openForm();
  });

  grid.appendChild(pixel);
}

// Form modal functions
function openForm() {
  formModal.classList.remove("hidden");
}

function closeForm() {
  formModal.classList.add("hidden");
  buyForm.reset();
}

// Submit form
buyForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(buyForm);
  const imageFile = formData.get("image");
  const url = formData.get("url");
  const name = formData.get("name");
  width = parseInt(formData.get("width"));
  height = parseInt(formData.get("height"));

  const reader = new FileReader();
  reader.onload = () => {
    const imgData = reader.result;

    // Mark pixels sold
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (startY + y) * 100 + (startX + x);
        soldPixels.add(idx);
        const px = grid.querySelector(`[data-index="${idx}"]`);
        if (px) px.style.backgroundColor = "transparent";
      }
    }

    // Display meme
    const cover = document.createElement("a");
    cover.href = url;
    cover.target = "_blank";
    cover.className = "cover-block";
    cover.title = name;
    cover.style.left = `${startX * 10}px`;
    cover.style.top = `${startY * 10}px`;
    cover.style.width = `${width * 10}px`;
    cover.style.height = `${height * 10}px`;
    cover.style.backgroundImage = `url(${imgData})`;
    grid.appendChild(cover);

    // Save to Firebase
    const blockData = {
      startX,
      startY,
      width,
      height,
      name,
      url,
      image: imgData
    };

    database.ref("blocks").push(blockData);

    closeForm();
    alert("Your meme has been uploaded!");
  };

  if (imageFile) {
    reader.readAsDataURL(imageFile);
  } else {
    alert("Please select an image.");
  }
});

// Load existing memes
database.ref("blocks").once("value", (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  Object.values(data).forEach((block) => {
    const { startX, startY, width, height, image, url, name } = block;

    // Mark pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (startY + y) * 100 + (startX + x);
        soldPixels.add(idx);
        const px = grid.querySelector(`[data-index="${idx}"]`);
        if (px) px.style.backgroundColor = "transparent";
      }
    }

    // Display
    const cover = document.createElement("a");
    cover.href = url;
    cover.target = "_blank";
    cover.className = "cover-block";
    cover.title = name;
    cover.style.left = `${startX * 10}px`;
    cover.style.top = `${startY * 10}px`;
    cover.style.width = `${width * 10}px`;
    cover.style.height = `${height * 10}px`;
    cover.style.backgroundImage = `url(${image})`;
    grid.appendChild(cover);
  });
});

// Load saved memes from Firebase on page load
database.ref("memes").on("value", (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  Object.keys(data).forEach((pixelId) => {
    const pixel = document.getElementById(pixelId);
    if (pixel) {
      pixel.style.backgroundImage = `url(${data[pixelId].image})`;
      pixel.style.backgroundSize = "cover";
      pixel.onclick = () => window.open(data[pixelId].link, "_blank");
    }
  });
});
