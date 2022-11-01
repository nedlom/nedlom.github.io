const myImage = document.querySelector("img");
let myButton = document.querySelector("button");
let myHeading = document.querySelector("h1");

function setUserName() {
  const myName = prompt("Please enter your name.");
  if (!myName) {
    setUserName();
  } else {
    localStorage.setItem("name", myName);
    myHeading.textContent = `Mozilla is cool, ${myName}`;
  }
}

myButton.onclick = () => {
  setUserName();
}

myImage.onclick = () => {
  console.log("clicked")
  const mySrc = myImage.getAttribute("src");
  if (mySrc === "images/chrome1.png") {
    myImage.setAttribute("src", "images/tm.png");
  } else {
    myImage.setAttribute("src", "images/chrome1.png")
  }
};

if (!localStorage.getItem("name")) {
  setUserName();
} else {
  const storedName = localStorage.getItem("name");
  myHeading.textContent = `Mozilla is cool, ${storedName}`;
}