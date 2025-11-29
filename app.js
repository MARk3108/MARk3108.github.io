document.addEventListener("DOMContentLoaded", () => {
  const stepsContainer = document.getElementById("stepsContainer");
  const finalMessage = document.getElementById("finalMessage");

  const imgbbApiKey = "db49fe557db4fe09ca5bf7a4760969b7";
  const PROOFS_COLLECTION = "questProofs";

  const firebaseConfig = {
    apiKey: "AIzaSyC7FtCTCIyOtfWBO4_QRJ7TU0Jq1rGkNqg",
    authDomain: "web-version-b17f0.firebaseapp.com",
    databaseURL: "https://web-version-b17f0-default-rtdb.firebaseio.com",
    projectId: "web-version-b17f0",
    storageBucket: "web-version-b17f0.firebasestorage.app",
    messagingSenderId: "502006895528",
    appId: "1:502006895528:web:57050097eeab512f89c39d"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const db = firebase.firestore();
  const stepViews = [];
  let highestCompletedIndex = -1;

  const questSteps = [
    {
      title: "Специальное задание из Таганрога ",
      clue:
        "Сообщение от Даны, которая следит даже из Таганрога, чтобы ты не пила плохие бамблы. Её спец-миссия для тебя: зайти, взять бамбл и сделать фото так, будто она лично проверяет качество. Важно оценить напиток по всем критериям Даны Марковой!",
      badge: "①",
      badgeClasses: "bg-pink-500/30 border border-pink-300/30",
      btnText: "Хочешь пройти дальше — загружай фото →",
    },
    {
      title: "Рыбы, которые явно что-то замышляют",
      clue:
        "Идём туда, где синяя подсветка, стекло и существа, которые выглядят так, будто обсуждают тебя между собой. Твоя цель: выбрать самую характерную рыбину и сфоткаться с ней как с подружкой, которая всегда поддерживает сплетни.",
      badge: "②",
      badgeClasses: "bg-rose-400/30 border border-rose-200/30",
      btnText: "Загрузишь фото — откроется следующий шаг →",
    },
    {
      title: "Азиатская остановка удовольствия",
      clue:
        "Пора поесть. Chang — место, где всё либо ароматное, либо острое, либо оба сразу. Твоя миссия: Сделай фото с тем, что закажешь. Можно блюдо, можно лицо «мне вкусно», можно и то, и то.",
      badge: "③",
      badgeClasses: "bg-pink-400/30 border border-pink-200/30",
      btnText: "Кидаешь фото — и идём дальше →",
    },
    {
      title: "Официальный сахарный чекпоинт",
      clue:
        "Пора на сладкое. Берёшь то, что звучит вкусно, и делаешь фото, как будто тебя снимают для рекламы кофейни.",
      badge: "④",
      badgeClasses: "bg-rose-500/30 border border-rose-300/30",
      btnText: "Кидаешь фото — и идём дальше →",
    },
    {
      title: "Место, где гравитация сдаётся",
      clue:
        "Финал. Ты + батуты + камера = великий момент.",
      badge: "⑤",
      badgeClasses: "bg-pink-500/30 border border-pink-300/30",
      btnText: "Сделай фото в своем коронном элементе, если получится поймать прыжок — всё, ты победила этот квест официально →",
    },
  ];

  questSteps.forEach((step, index) => {
    const card = createStepCard(step, index);
    stepsContainer.appendChild(card);
  });

  subscribeToProofs();

  function createStepCard(step, index) {
    const card = document.createElement("section");
    card.className = "quest-card glass rounded-3xl p-8 glow fade-in";
    if (index > 0) {
      card.classList.add("hidden");
    }
    card.dataset.stepIndex = index.toString();

    card.innerHTML = `
      <div class="flex items-start gap-4 mb-8">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl ${step.badgeClasses}">
          <span class="text-2xl">${step.badge}</span>
        </div>
        <div class="text-left">
          <h2 class="text-2xl font-semibold mb-2 text-slate-800">${step.title}</h2>
          <p class="text-slate-700 leading-relaxed">
            ${step.clue}
          </p>
        </div>
      </div>

      <div class="space-y-6" data-upload-block>
        <form class="space-y-6" data-upload-form>
          <div class="dropzone border-2 border-dashed border-pink-500/50 rounded-2xl p-6 text-center transition hover:border-pink-400/80">
            <input type="file" accept="image/*" class="hidden" data-photo-input />
            <label class="cursor-pointer text-sm uppercase tracking-wide text-pink-600 hover:text-pink-700 transition" data-photo-label>
              📸 Загружай фото сюда 📸
            </label>
            <p class="mt-3 text-slate-700 text-sm" data-file-name></p>
          </div>

          <button
            type="submit"
            class="w-full md:w-auto px-8 py-3 rounded-full bg-pink-500 text-white font-semibold uppercase tracking-wide transition hover:scale-[1.02] hover:bg-pink-600 focus:ring focus:ring-pink-400/40 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/50"
            data-upload-btn
          >
            ${step.btnText}
          </button>

          <div class="text-sm text-slate-700 min-h-[1.25rem]" data-upload-status></div>
          <div class="progress-track opacity-0" data-progress-bar>
            <div class="progress-fill" data-progress-fill></div>
          </div>
        </form>
        <p class="text-sm text-pink-600 font-semibold hidden" data-completion-note>
          ✅ Фото засчитано. Листай для продолжения 💖
        </p>
      </div>

      <section
        class="verified-panel mt-10 hidden opacity-0 translate-y-4 transition glass border border-pink-300/50 rounded-3xl p-6"
        data-uploaded-wrapper
      >
        <div class="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-pink-600/80">
              ✅ Подтвержденное фото 💖
            </p>
            <h3 class="text-xl font-semibold text-slate-800">
              ${step.title} proof
            </h3>
          </div>
          <span class="text-sm text-slate-600" data-uploaded-meta></span>
        </div>
        <div class="rounded-3xl border border-pink-200/60 shadow-2xl bg-white/50 p-3">
          <img
            alt="Uploaded clue location"
            class="block mx-auto w-auto max-w-full max-h-[80vh] object-contain"
            loading="lazy"
            data-uploaded-image
          />
        </div>
      </section>
    `;

    const input = card.querySelector("[data-photo-input]");
    const label = card.querySelector("[data-photo-label]");
    const inputId = `quest-photo-${index}`;
    if (input && label) {
      input.id = inputId;
      label.setAttribute("for", inputId);
    }

    const view = wireUploadLogic(card, index, step);
    stepViews[index] = view;
    return card;
  }

  function wireUploadLogic(card, index, step) {
    const form = card.querySelector("[data-upload-form]");
    const photoInput = card.querySelector("[data-photo-input]");
    const fileName = card.querySelector("[data-file-name]");
    const uploadBtn = card.querySelector("[data-upload-btn]");
    const uploadStatus = card.querySelector("[data-upload-status]");
    const progressBar = card.querySelector("[data-progress-bar]");
    const progressFill = card.querySelector("[data-progress-fill]");
    const uploadedWrapper = card.querySelector("[data-uploaded-wrapper]");
    const uploadedImage = card.querySelector("[data-uploaded-image]");
    const uploadedLink = card.querySelector("[data-uploaded-link]");
    const completionNote = card.querySelector("[data-completion-note]");
    const uploadedMeta = card.querySelector("[data-uploaded-meta]");

    const view = {
      card,
      form,
      photoInput,
      fileName,
      uploadBtn,
      uploadStatus,
      progressBar,
      progressFill,
      uploadedWrapper,
      uploadedImage,
      uploadedLink,
      completionNote,
      uploadedMeta,
      step,
      isCompleted: false,
    };

    if (!form || !photoInput) {
      return view;
    }

    photoInput.addEventListener("change", () => {
      fileName.textContent = photoInput.files[0]
        ? photoInput.files[0].name
        : "";
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (view.isCompleted) return;
      const file = photoInput.files[0];
      if (!file) {
        uploadStatus.textContent = "Choose a photo before uploading.";
        return;
      }

      uploadBtn.disabled = true;
      uploadStatus.textContent = "📤 Uploading to imgbb...";
      progressBar.classList.remove("opacity-0");
      progressFill.style.width = "0%";

      uploadImageToImgbb(file, (progress) => {
        progressFill.style.width = `${progress}%`;
      })
        .then((data) => {
          uploadStatus.textContent = "✅ Photo uploaded! Saving proof...";
          return saveProofToFirestore(index, step.title, data.display_url).then(
            () => ({
              url: data.display_url,
              timestamp: new Date(),
            }),
          );
        })
        .then((proof) => {
          if (proof) {
            createEmojiSplash(uploadBtn);
            markStepCompleted(index, {
              stepTitle: step.title,
              url: proof.url,
              timestamp: proof.timestamp,
            });
            unlockNextStep(index + 1);
          }
        })
        .catch((error) => {
          console.error(error);
          uploadStatus.textContent =
            error.message || "Upload fizzled. Try again.";
          uploadBtn.disabled = false;
        })
        .finally(() => {
          progressBar.classList.add("opacity-0");
          progressFill.style.width = "0%";
        });
    });

    return view;
  }

  function createEmojiSplash(buttonElement) {
    const emojis = ["🎉", "🎂", "💖", "💕", "🎈", "✨", "🌟", "💝", "🎁", "🥳"];
    const count = 20;
    
    // Get bottom center of screen position
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight - 50; // 50px from bottom
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const splash = document.createElement("div");
        splash.className = "emoji-splash";
        splash.textContent = emoji;
        
        // Calculate angle for radial spread (mostly upward, but with some spread)
        // Most emojis go up, but with variation
        const baseAngle = -Math.PI / 2; // Upward (270 degrees)
        const spread = Math.PI * 0.8; // 80% spread (mostly up, some to sides)
        const angle = baseAngle + (Math.random() - 0.5) * spread;
        const finalAngle = angle;
        
        // Calculate distance and direction
        const distance = 300 + Math.random() * 300; // 300-600px distance
        const endX = centerX + Math.cos(finalAngle) * distance;
        const endY = centerY + Math.sin(finalAngle) * distance;
        
        // Set initial position (bottom center)
        splash.style.left = `${centerX}px`;
        splash.style.top = `${centerY}px`;
        splash.style.transform = `translate(-50%, -50%)`;
        
        document.body.appendChild(splash);
        
        // Animate to end position
        requestAnimationFrame(() => {
          splash.style.transition = 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          splash.style.left = `${endX}px`;
          splash.style.top = `${endY}px`;
          splash.style.opacity = '0';
          splash.style.transform = `translate(-50%, -50%) scale(1.5) rotate(${finalAngle * 180 / Math.PI + 90}deg)`;
        });
        
        setTimeout(() => {
          splash.remove();
        }, 2000);
      }, i * 30);
    }
  }

  function markStepCompleted(index, proof) {
    const view = stepViews[index];
    if (!view || view.isCompleted) return;

    view.card.classList.remove("hidden");
    view.card.classList.add("fade-in");
    view.isCompleted = true;
    highestCompletedIndex = Math.max(highestCompletedIndex, index);

    if (view.uploadBtn) {
      view.uploadBtn.disabled = true;
    }
    if (view.form) {
      view.form.classList.add("hidden");
    }
    if (view.completionNote) {
      view.completionNote.classList.remove("hidden");
    }
    if (view.uploadStatus) {
      const timeStampText = proof?.timestamp
        ? `Proof synced ${formatTimestamp(proof.timestamp)}`
        : "Proof synced.";
      view.uploadStatus.textContent = timeStampText;
      if (view.uploadedMeta) {
        view.uploadedMeta.textContent = timeStampText;
      }
    }
    if (view.uploadedImage && proof?.url) {
      view.uploadedImage.src = proof.url;
    }
    if (view.uploadedLink && proof?.url) {
      view.uploadedLink.textContent = proof.url;
      view.uploadedLink.href = proof.url;
    }
    if (view.uploadedWrapper) {
      view.uploadedWrapper.classList.remove("hidden");
      requestAnimationFrame(() => {
        view.uploadedWrapper.classList.remove("opacity-0");
        view.uploadedWrapper.classList.remove("translate-y-4");
      });
    }
  }

  function unlockNextStep(targetIndex) {
    if (targetIndex >= questSteps.length) {
      if (finalMessage) {
        finalMessage.classList.remove("hidden");
        finalMessage.classList.add("fade-in");
      }
      return;
    }

    const view = stepViews[targetIndex];
    if (view) {
      view.card.classList.remove("hidden");
      view.card.classList.add("fade-in");
    }
  }

  function subscribeToProofs() {
    db.collection(PROOFS_COLLECTION).onSnapshot(
      (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          const stepIndex = data.stepIndex;
          if (typeof stepIndex === "number") {
            markStepCompleted(stepIndex, {
              stepTitle: data.stepTitle,
              url: data.url,
              timestamp: data.updatedAt?.toDate?.() || new Date(),
            });
          }
        });
        unlockNextStep(highestCompletedIndex + 1);
      },
      (error) => {
        console.error("Failed to sync proofs:", error);
      },
    );
  }

  function saveProofToFirestore(index, stepTitle, url) {
    const payload = {
      stepIndex: index,
      stepTitle,
      url,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    return db.collection(PROOFS_COLLECTION).doc(`step-${index}`).set(payload);
  }

  function uploadImageToImgbb(file, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("key", imgbbApiKey);
      formData.append("image", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.imgbb.com/1/upload");

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && typeof onProgress === "function") {
          const progress = (event.loaded / event.total) * 100;
          onProgress(Math.min(progress, 100));
        }
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== XMLHttpRequest.DONE) return;

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            if (result.success) {
              resolve(result.data);
            } else {
              reject(
                new Error(result.error?.message || "Upload rejected by imgbb."),
              );
            }
          } catch (error) {
            reject(new Error("Could not parse the upload response."));
          }
        } else {
          reject(new Error("Upload failed. Check your API key or quota."));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error while uploading. Try again."));
      };

      xhr.send(formData);
    });
  }

  function formatTimestamp(dateLike) {
    const date =
      dateLike instanceof Date ? dateLike : new Date(dateLike ?? Date.now());
    return date.toLocaleString();
  }
});