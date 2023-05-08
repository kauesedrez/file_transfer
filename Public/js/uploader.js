class Uploader {
  constructor() {
    this.uploadForm = document.querySelector("#upload-form");
    this.input = document.getElementById("files");
    this.submit = document.getElementById("submit-button");
    this.fileList = document.querySelector("#file-list");
    this.uploaderBox = document.getElementById("uploader-box");
    this.addSubmitListener();
  }

  addSubmitListener() {
    this.uploaderBox.addEventListener("click", async event => {
      this.input.click();
    });

    this.input.addEventListener("change", async event => {
      this.submit.click();
    });

    this.uploadForm.addEventListener("submit", async event => {
      event.preventDefault();
      const files = event["target"]["files"].files;

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        const preview = await this.createPreview(files[i]);
        const progressBar = this.createProgressBar(
          files[i].name,
          preview
        );
        progressBar.sizeElem.textContent = this.formatBytes(
          files[i].size
        );
        this.uploadFile(
          formData,
          progressBar.progressBar,
          progressBar.speedElem
        );
      }
    });
  }

  createPreview(file) {
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
          //   image.width = 300;
          image.classList.add("img-preview");
          preview.appendChild(image);

          resolve(preview);
        });
      } else if (file.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.src = URL.createObjectURL(file);
        video.preload = "metadata";
        // video.width = 300;
        // video.height = 300;
        video.classList.add("video-preview");
        video.addEventListener("loadedmetadata", () => {
          preview.appendChild(video);
          resolve(preview);
        });
      } else {
        resolve(preview);
      }
    });
  }

  /**
   *
   * @param {*} fileName
   * @param {*} preview
   * @returns {{progressBar:any,speedElem:any,sizeElem:any}}
   */
  createProgressBar(fileName, preview) {
    const container = document.createElement("div");
    container.classList.add("file-container");
    container.appendChild(preview);

    const progressBar = document.createElement("progress");
    progressBar.value = 0;
    progressBar.max = 100;
    progressBar.classList.add("progress");
    container.appendChild(progressBar);

    const speedElem = document.createElement("div");
    speedElem.textContent = "0 B/s";
    speedElem.classList.add("speed");
    container.appendChild(speedElem);

    const sizeElem = document.createElement("div");
    sizeElem.textContent = "";
    sizeElem.classList.add("size");
    container.appendChild(sizeElem);

    const fileNameElem = document.createElement("div");
    fileNameElem.textContent = fileName;
    fileNameElem.classList.add("filename");
    container.appendChild(fileNameElem);

    this.fileList.appendChild(container);

    return { progressBar, speedElem, sizeElem };
  }

  uploadFile(formData, progressBar, speedElement) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload");
    const startTime = Date.now();
    xhr.upload.addEventListener("progress", event => {
      const progress = Math.round((event.loaded / event.total) * 100);
      const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
      const speed = this.calculateSpeed(event.loaded, elapsedTime);
      this.updateProgressBar(
        progressBar,
        progress,
        speedElement,
        speed
      );
    });
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.response);
        // addFileToList(data.fileName);
      } else {
        console.log("Error uploading file");
      }
    });
    xhr.addEventListener("error", () => {
      console.log("Error uploading file");
    });
    xhr.send(formData);
  }

  calculateSpeed(loaded, elapsed) {
    const now = Date.now();
    // const elapsed = (now - timeStamp) / 1000; // in seconds
    const speed = loaded / elapsed; // in bytes per second
    console.log({ elapsed, speed });
    return this.formatBytes(speed) + "/s";
  }

  formatBytes(bytes) {
    if (bytes === 0) {
      return "0 B";
    }
    const k = 1024;
    const sizes = [
      "B",
      "KB",
      "MB",
      "GB",
      "TB",
      "PB",
      "EB",
      "ZB",
      "YB",
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    console.log({ i, calculada: Math.min(i, sizes.length - 1) });
    const size = sizes[Math.min(i, sizes.length - 1)];
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + size
    );
  }

  updateProgressBar(progressBar, progress, speedElement, speed) {
    progressBar.value = progress;
    speedElement.textContent = speed;
  }
}

// Load files when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
  new Uploader();
});
