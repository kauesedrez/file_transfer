const uploadForm = document.querySelector("#upload-form");
const fileList = document.querySelector("#file-list");

// Handle file uploads
uploadForm.addEventListener("submit", async event => {
  event.preventDefault();
  const files = event["target"]["files"].files;

  for (let i = 0; i < files.length; i++) {
    const formData = new FormData();
    formData.append("file", files[i]);
    const preview = await createPreview(files[i]);
    const progressBar = createProgressBar(files[i].name, preview);
    // const progressBar = createProgressBar(files[i].name);
    uploadFile(formData, progressBar.progressBar);
  }
});

function createPreview(file) {
  return new Promise(resolve => {
    const preview = document.createElement("div");
    preview.classList.add("preview");

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.addEventListener("load", () => {
        const image = document.createElement("img");
        typeof reader.result === "string" &&
          (image.src = reader.result);
        image.width = 300;
        preview.appendChild(image);

        resolve(preview);
      });
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.preload = "metadata";
      video.width = 300;
      video.height = 300;
      video.addEventListener("loadedmetadata", () => {
        preview.appendChild(video);
        resolve(preview);
      });
    } else {
      resolve(preview);
    }
  });
}

// function uploadFile(formData, progressBar) {
//   const xhr = new XMLHttpRequest();
//   xhr.open("POST", "/upload");
//   xhr.upload.addEventListener("progress", event => {
//     const progress = Math.round((event.loaded / event.total) * 100);
//     const speed = calculateSpeed(event.loaded, event.timeStamp);
//     updateProgressBar(progressBar, progress, speed);
//     console.log({ progress, speed });
//   });
//   xhr.addEventListener("load", () => {
//     if (xhr.status === 200) {
//       const data = JSON.parse(xhr.response);
//       addFileToList(data.fileName);
//     } else {
//       console.log("Error uploading file");
//     }
//   });
//   xhr.addEventListener("error", () => {
//     console.log("Error uploading file");
//   });
//   xhr.send(formData);
// }

function uploadFile(formData, progressBar) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/upload");
  const startTime = Date.now();
  xhr.upload.addEventListener("progress", event => {
    const progress = Math.round((event.loaded / event.total) * 100);
    const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
    const speed = calculateSpeed(event.loaded, elapsedTime);
    updateProgressBar(progressBar, progress, speed);
    console.log({ progress, speed });
  });
  xhr.addEventListener("load", () => {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.response);
      addFileToList(data.fileName);
    } else {
      console.log("Error uploading file");
    }
  });
  xhr.addEventListener("error", () => {
    console.log("Error uploading file");
  });
  xhr.send(formData);
}

function calculateSpeed(loaded, elapsed) {
  const now = Date.now();
  // const elapsed = (now - timeStamp) / 1000; // in seconds
  const speed = loaded / elapsed; // in bytes per second
  console.log({ elapsed, speed });
  return formatBytes(speed) + "/s";
}

function formatBytes(bytes) {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  console.log({ i, calculada: Math.min(i, sizes.length - 1) });
  const size = sizes[Math.min(i, sizes.length - 1)];
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + size;
}

/**
 *
 * @param {*} fileName
 * @param {*} preview
 * @returns {{progressBar:any,speedElem:any}}
 */
function createProgressBar(fileName, preview) {
  const container = document.createElement("div");
  container.classList.add("file-container");
  container.appendChild(preview);

  const progressBar = document.createElement("progress");
  progressBar.value = 0;
  progressBar.max = 100;
  container.appendChild(progressBar);

  const speedElem = document.createElement("div");
  speedElem.textContent = "0 B/s";
  container.appendChild(speedElem);

  const fileNameElem = document.createElement("div");
  fileNameElem.textContent = fileName;
  container.appendChild(fileNameElem);

  fileList.appendChild(container);

  return { progressBar, speedElem };
}

// function updateProgressBar(progressBar, progress) {
//   progressBar.value = progress;
// }

function updateProgressBar(progressBar, progress, speed) {
  progressBar.value = progress;
  progressBar.setAttribute("data-speed", speed);
  progressBar.textContent = `${progress}%`;
  progressBar.title = `${speed} - ${progress}%`;
  progressBar.style.backgroundImage = `linear-gradient(to right, #4CAF50, #4CAF50 ${progress}%, #ddd ${progress}%, #ddd)`;
  progressBar.style.backgroundSize = "200% 100%";
  progressBar.style.backgroundPosition = "right center";
  progressBar.style.transition =
    "background-position 0.3s ease-in-out";
}

// Handle file downloads
fileList.addEventListener("click", async event => {
  // @ts-ignore
  if (event.target.classList.contains("download-link")) {
    event.preventDefault();
    // @ts-ignore
    const fileName = event.target.dataset.filename;

    try {
      const response = await fetch(`/download/${fileName}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        console.log("Error downloading file");
      }
    } catch (error) {
      console.log(error);
    }
  }
});

// Add a new file to the list of uploaded files
function addFileToList(fileName) {
  const row = document.createElement("tr");
  const nameCell = document.createElement("td");
  const downloadCell = document.createElement("td");
  const downloadLink = document.createElement("a");

  nameCell.textContent = fileName;
  downloadLink.href = `/download/${fileName}`;
  downloadLink.textContent = "Download";
  downloadLink.dataset.filename = fileName;
  downloadLink.classList.add("download-link");

  downloadCell.appendChild(downloadLink);

  row.appendChild(nameCell);
  row.appendChild(downloadCell);

  fileList.querySelector("tbody").appendChild(row);
}

function loadFiles() {
  fetch("/files")
    .then(response => response.json())
    .then(data => {
      console.log({ data });
      const filesTableBody = document.querySelector(
        "#filesTable tbody"
      );
      filesTableBody.innerHTML = "";
      data.forEach(file => {
        const row = document.createElement("tr");

        const fileNameCell = document.createElement("td");
        fileNameCell.textContent = file.name;
        row.appendChild(fileNameCell);

        const thumbnailCell = document.createElement("td");
        console.log(file.name);
        if (isImage(file.name)) {
          console.log("é uma imagem");
          const thumbnail = document.createElement("img");
          thumbnail.src = file.url;
          //   thumbnail.height = 100;
          thumbnail.width = 400;
          thumbnailCell.appendChild(thumbnail);
        } else if (isVideo(file.name)) {
          const videoPlayer = document.createElement("video");
          videoPlayer.src = file.url;
          videoPlayer.width = 400;
          videoPlayer.height = 400;
          videoPlayer.controls = true;
          thumbnailCell.appendChild(videoPlayer);
        }
        row.appendChild(thumbnailCell);

        const fileSizeCell = document.createElement("td");
        fileSizeCell.textContent = humanFileSize(file.size, true);
        row.appendChild(fileSizeCell);

        const downloadCell = document.createElement("td");
        const downloadLink = document.createElement("a");
        downloadLink.setAttribute("href", `/download/${file.name}`);
        downloadLink.setAttribute("download", "");
        downloadLink.textContent = "Download";
        downloadCell.appendChild(downloadLink);
        row.appendChild(downloadCell);

        filesTableBody.appendChild(row);
      });
    })
    .catch(error => console.error(error));
}

// Function to convert file sizes to human-readable format
function humanFileSize(bytes, si) {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }
  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10;
  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );
  return bytes.toFixed(1) + " " + units[u];
}

// function formatBytes(bytes) {
//   if (bytes === 0) {
//     return "0 B";
//   }
//   const k = 1024;
//   const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   console.log({ i });
//   const size = sizes[i];
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + size;
// }

// Load files when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
  loadFiles();
});

function isImage(fileName) {
  const imageExtensions = ["jpg", "jpeg", "png", "gif"];
  const extension = getFileExtension(fileName);
  return imageExtensions.includes(extension.toLowerCase());
}

function isVideo(fileName) {
  const videoExtensions = ["mp4", "webm", "ogg", "avi"];
  const extension = getFileExtension(fileName);
  return videoExtensions.includes(extension.toLowerCase());
}

function getFileExtension(fileName) {
  return fileName.split(".")[1];
}
