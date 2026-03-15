const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const workoutForm = document.getElementById("workoutForm");
const calorieForm = document.getElementById("calorieForm");
const coachForm = document.getElementById("coachForm");
const apiConfigForm = document.getElementById("apiConfigForm");

const registerMessage = document.getElementById("registerMessage");
const loginMessage = document.getElementById("loginMessage");
const workoutMessage = document.getElementById("workoutMessage");
const calorieMessage = document.getElementById("calorieMessage");
const apiConfigMessage = document.getElementById("apiConfigMessage");

const entriesList = document.getElementById("entriesList");
const workoutList = document.getElementById("workoutList");
const mealList = document.getElementById("mealList");
const coachChat = document.getElementById("coachChat");

const clearEntriesButton = document.getElementById("clearEntries");
const logoutButton = document.getElementById("logoutButton");

const authView = document.getElementById("authView");
const dashboardView = document.getElementById("dashboardView");
const welcomeText = document.getElementById("welcomeText");
const workoutCount = document.getElementById("workoutCount");
const calorieTotal = document.getElementById("calorieTotal");
const goalStatus = document.getElementById("goalStatus");
const apiModeBadge = document.getElementById("apiModeBadge");
const modelSelect = document.getElementById("modelSelect");

const DB_NAME = "login_app";
const ACCOUNTS_STORE = "konten";
const FITNESS_STORE = "fitness";
const LEGACY_STORE_NAME = "anmeldungen";
const DB_VERSION = 3;
const SESSION_KEY = "fitness_current_user";
const OPENAI_MODEL_STORAGE = "pulsefit_openai_model";

let currentUser = null;
let latestDashboardEntries = [];

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      const transaction = request.transaction;

      if (!db.objectStoreNames.contains(ACCOUNTS_STORE)) {
        const accountsStore = db.createObjectStore(ACCOUNTS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });

        accountsStore.createIndex("createdAt", "createdAt");
      }

      if (!db.objectStoreNames.contains(FITNESS_STORE)) {
        const fitnessStore = db.createObjectStore(FITNESS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });

        fitnessStore.createIndex("email", "email");
        fitnessStore.createIndex("type", "type");
      }

      if (
        db.objectStoreNames.contains(LEGACY_STORE_NAME) &&
        transaction &&
        request.oldVersion < DB_VERSION
      ) {
        const legacyStore = transaction.objectStore(LEGACY_STORE_NAME);
        const accountsStore = transaction.objectStore(ACCOUNTS_STORE);
        const legacyEntriesRequest = legacyStore.getAll();

        legacyEntriesRequest.onsuccess = () => {
          legacyEntriesRequest.result.forEach((entry) => {
            accountsStore.add({
              email: entry.email,
              passwordHash: entry.passwordHash,
              createdAt: entry.createdAt || Date.now(),
            });
          });

          db.deleteObjectStore(LEGACY_STORE_NAME);
        };
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getStore(db, storeName, mode = "readonly") {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function resetMessage(element) {
  element.className = "message";
  element.textContent = "";
}

function showMessage(element, text, type) {
  resetMessage(element);
  element.textContent = text;
  element.classList.add(type);
}

async function hashValue(value) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrentDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderEmptyState(list, text) {
  list.innerHTML = "";
  const item = document.createElement("li");
  item.className = "empty-state";
  item.textContent = text;
  list.appendChild(item);
}

function renderAccountEntries(entries) {
  entriesList.innerHTML = "";

  if (!entries.length) {
    renderEmptyState(entriesList, "Noch keine Konten gespeichert.");
    return;
  }

  entries
    .slice()
    .sort((left, right) => right.createdAt - left.createdAt)
    .forEach((entry) => {
      const item = document.createElement("li");
      item.className = "entry";

      const email = document.createElement("strong");
      email.textContent = entry.email;

      const meta = document.createElement("span");
      meta.textContent = `Erstellt am ${formatDate(entry.createdAt)}`;

      item.append(email, meta);
      entriesList.appendChild(item);
    });
}

function renderWorkoutEntries(entries) {
  workoutList.innerHTML = "";

  if (!entries.length) {
    renderEmptyState(workoutList, "Noch keine Workouts gespeichert.");
    return;
  }

  entries
    .filter((entry) => entry.type === "workout")
    .sort((left, right) => right.createdAt - left.createdAt)
    .forEach((entry) => {
      const item = document.createElement("li");
      item.className = "entry";

      const title = document.createElement("strong");
      title.textContent = entry.name;

      const meta = document.createElement("span");
      meta.textContent = `${entry.duration} Minuten am ${formatDate(entry.createdAt)}`;

      const notes = document.createElement("span");
      notes.textContent = entry.notes ? entry.notes : "Keine Notizen gespeichert.";

      item.append(title, meta, notes);
      workoutList.appendChild(item);
    });
}

function renderMealEntries(entries) {
  mealList.innerHTML = "";

  const todaysMeals = entries
    .filter((entry) => entry.type === "meal" && entry.dateKey === formatCurrentDateKey())
    .sort((left, right) => right.createdAt - left.createdAt);

  if (!todaysMeals.length) {
    renderEmptyState(mealList, "Noch keine Mahlzeiten fuer heute gespeichert.");
    return;
  }

  todaysMeals.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "entry";

    const title = document.createElement("strong");
    title.textContent = entry.meal;

    const meta = document.createElement("span");
    meta.textContent = `${entry.calories} kcal um ${formatDate(entry.createdAt)}`;

    if (entry.goal) {
      const goal = document.createElement("span");
      goal.textContent = `Tagesziel: ${entry.goal} kcal`;
      item.append(title, meta, goal);
    } else {
      item.append(title, meta);
    }

    mealList.appendChild(item);
  });
}

function appendChatMessage(role, text) {
  const bubble = document.createElement("article");
  bubble.className = `chat-bubble chat-bubble--${role}`;
  bubble.textContent = text;
  coachChat.appendChild(bubble);
  coachChat.scrollTop = coachChat.scrollHeight;
}

function resetCoachChat() {
  coachChat.innerHTML = "";
  appendChatMessage(
    "assistant",
    "Hallo, ich bin dein Fitness-Coach. Frag mich zum Beispiel nach Muskelaufbau, Abnehmen, Eiweiss, Trainingsplan oder Regeneration."
  );
}

function getStoredModel() {
  return localStorage.getItem(OPENAI_MODEL_STORAGE) || "gpt-5-mini";
}

function updateApiModeBadge() {
  apiModeBadge.textContent = "Server-Modus";
}

function initializeApiSettings() {
  modelSelect.value = getStoredModel();
  updateApiModeBadge();
}

function buildUserSummary(entries) {
  const workouts = entries.filter((entry) => entry.type === "workout");
  const todaysMeals = entries.filter(
    (entry) => entry.type === "meal" && entry.dateKey === formatCurrentDateKey()
  );
  const totalCalories = todaysMeals.reduce((sum, entry) => sum + entry.calories, 0);
  const latestGoalEntry = todaysMeals.find((entry) => entry.goal);
  const goal = latestGoalEntry ? latestGoalEntry.goal : 0;

  return {
    workouts: workouts.length,
    totalCalories,
    goal,
    latestWorkout: workouts[0] ? workouts[0].name : null,
  };
}

function createCoachReply(question, entries) {
  const normalized = question.trim().toLowerCase();
  const summary = buildUserSummary(entries);
  const personalizedNote = currentUser
    ? `Bei dir sehe ich aktuell ${summary.workouts} Workouts und ${summary.totalCalories} kcal fuer heute.`
    : "";

  if (!normalized) {
    return "Stell mir einfach eine kurze Fitnessfrage, zum Beispiel zu Eiweiss, Muskelaufbau oder Fettabbau.";
  }

  if (normalized.includes("eiweiss") || normalized.includes("protein")) {
    return `${personalizedNote} Fuer Muskelaufbau sind oft etwa 1,6 bis 2,2 Gramm Protein pro Kilogramm Koerpergewicht pro Tag sinnvoll. Verteile es moeglichst auf 3 bis 5 Mahlzeiten.`;
  }

  if (normalized.includes("abnehmen") || normalized.includes("fett") || normalized.includes("defizit")) {
    return `${personalizedNote} Fuer Fettabbau ist ein moderates Kaloriendefizit meistens nachhaltiger als extremes Hungern. Peile oft etwa 300 bis 500 kcal unter deinem Bedarf an und halte Protein sowie Krafttraining hoch.`;
  }

  if (normalized.includes("muskel") || normalized.includes("muskelaufbau") || normalized.includes("bulk")) {
    return `${personalizedNote} Fuer Muskelaufbau helfen ein leichter Kalorienueberschuss, progressive Steigerung im Training und genug Schlaf. Trainiere jede Muskelgruppe idealerweise 2-mal pro Woche mit sauberer Technik.`;
  }

  if (normalized.includes("kalorien") || normalized.includes("essen") || normalized.includes("ernaehr")) {
    if (summary.goal > 0) {
      const difference = summary.goal - summary.totalCalories;
      if (difference > 0) {
        return `${personalizedNote} Du liegst heute noch etwa ${difference} kcal unter deinem eingetragenen Ziel. Plane am besten eine proteinreiche Mahlzeit ein, damit du dein Ziel kontrolliert erreichst.`;
      }
      return `${personalizedNote} Du hast dein eingetragenes Tagesziel heute bereits erreicht oder uebertroffen. Achte jetzt vor allem auf gute Lebensmittelqualitaet und genug Fluessigkeit.`;
    }

    return `${personalizedNote} Wenn du Kalorien trackst, setze dir am besten ein klares Tagesziel und trage jede Mahlzeit direkt ein. So werden Entscheidungen viel einfacher.`;
  }

  if (normalized.includes("trainingsplan") || normalized.includes("plan") || normalized.includes("split")) {
    return "Ein einfacher Plan fuer viele Einsteiger ist 3-mal pro Woche Ganzkoerper oder 4-mal pro Woche Oberkoerper-Unterkoerper. Wichtig ist, dass du ihn konstant durchziehst und Gewichte oder Wiederholungen schrittweise steigerst.";
  }

  if (normalized.includes("regeneration") || normalized.includes("pause") || normalized.includes("schlaf")) {
    return "Regeneration ist ein echter Leistungsfaktor. Plane 7 bis 9 Stunden Schlaf ein, halte 1 bis 2 lockere oder freie Tage pro Woche und vermeide es, dauernd komplett bis ans Limit zu trainieren.";
  }

  if (normalized.includes("cardio") || normalized.includes("ausdauer")) {
    return "Cardio ist stark fuer Herz-Kreislauf, Fitness und Fettabbau. Eine gute Mischung ist 2 bis 3 lockere Einheiten pro Woche zusaetzlich zum Krafttraining, ohne dass dein Haupttraining darunter leidet.";
  }

  if (normalized.includes("beine") || normalized.includes("leg day")) {
    return "Fuer Beine sind Kniebeugen, Beinpresse, Rumaenisches Kreuzheben, Ausfallschritte und Wadenheben eine starke Basis. Arbeite sauber und versuche ueber Wochen mehr Wiederholungen oder Gewicht zu schaffen.";
  }

  if (normalized.includes("heute") || normalized.includes("status") || normalized.includes("fortschritt")) {
    if (!summary.workouts && !summary.totalCalories) {
      return "Heute sind noch keine Fitnessdaten eingetragen. Starte am besten mit einem Workout oder einer Mahlzeit, dann kann ich dir gezielter helfen.";
    }

    const workoutPart = summary.latestWorkout ? `Dein letztes Workout war ${summary.latestWorkout}.` : "Du hast noch kein Workout gespeichert.";
    return `${personalizedNote} ${workoutPart}`;
  }

  return `${personalizedNote} Meine Empfehlung: kombiniere Krafttraining, genug Protein, ein klares Kalorienziel und ausreichend Schlaf. Wenn du magst, frag mich ganz konkret nach Muskelaufbau, Abnehmen, Trainingsplan, Eiweiss oder Regeneration.`;
}

function buildOpenAIContext(entries) {
  const summary = buildUserSummary(entries);
  const workouts = entries
    .filter((entry) => entry.type === "workout")
    .slice(0, 3)
    .map((entry) => `${entry.name} (${entry.duration} Min)`)
    .join(", ");
  const meals = entries
    .filter((entry) => entry.type === "meal" && entry.dateKey === formatCurrentDateKey())
    .slice(0, 5)
    .map((entry) => `${entry.meal} (${entry.calories} kcal)`)
    .join(", ");

  return [
    `Benutzer: ${currentUser || "unbekannt"}`,
    `Workouts gesamt: ${summary.workouts}`,
    `Kalorien heute: ${summary.totalCalories}`,
    `Kalorienziel heute: ${summary.goal || "nicht gesetzt"}`,
    `Letzte Workouts: ${workouts || "keine"}`,
    `Heutige Mahlzeiten: ${meals || "keine"}`,
  ].join("\n");
}

async function askOpenAI(question, entries) {
  const model = getStoredModel();

  const instructions =
    "Du bist ein hilfreicher deutschsprachiger Fitness-Coach in einer Fitness-App. Antworte klar, motivierend und kurz. Gib keine medizinischen Diagnosen. Nutze den Nutzerkontext, wenn er vorhanden ist.";

  const input = [
    `App-Kontext:\n${buildOpenAIContext(entries)}`,
    `Frage des Nutzers:\n${question}`,
  ].join("\n\n");

  const response = await fetch("/api/coach", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP_${response.status}`);
  }

  const data = await response.json();

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const textFromOutput = (data.output || [])
    .flatMap((item) => item.content || [])
    .map((item) => item.text || "")
    .join(" ")
    .trim();

  if (textFromOutput) {
    return textFromOutput;
  }

  throw new Error("EMPTY_OPENAI_RESPONSE");
}

function formatOpenAIError(error) {
  const raw = String(error?.message || error || "");

  if (raw.includes("Failed to fetch")) {
    return "Der Browser konnte den Server nicht erreichen. Lokal ohne Backend funktioniert der echte OpenAI-Coach nicht.";
  }

  if (raw.includes("401")) {
    return "Der Server konnte den OpenAI API Key nicht nutzen. Bitte pruefe die Umgebungsvariable auf dem Deployment.";
  }

  if (raw.includes("429")) {
    return "Zu viele Anfragen oder kein verfuegbares Guthaben. Bitte pruefe Limits und Billing in deinem OpenAI Konto.";
  }

  if (raw.includes("quota") || raw.includes("insufficient_quota")) {
    return "Dein OpenAI Projekt hat aktuell kein verfuegbares Guthaben oder das Limit ist erreicht.";
  }

  if (raw.includes("model")) {
    return "Das ausgewaehlte Modell konnte nicht genutzt werden. Bitte probiere ein anderes Modell.";
  }

  if (raw.includes("OPENAI_API_KEY")) {
    return "Auf dem Server fehlt die Umgebungsvariable OPENAI_API_KEY.";
  }

  if (raw.length > 180) {
    return raw.slice(0, 180) + "...";
  }

  return raw || "Unbekannter Fehler bei der OpenAI Anfrage.";
}

function updateDashboardStats(entries) {
  const workouts = entries.filter((entry) => entry.type === "workout");
  const todaysMeals = entries.filter(
    (entry) => entry.type === "meal" && entry.dateKey === formatCurrentDateKey()
  );

  const totalCalories = todaysMeals.reduce((sum, entry) => sum + entry.calories, 0);
  const latestGoalEntry = todaysMeals.find((entry) => entry.goal);
  const goal = latestGoalEntry ? latestGoalEntry.goal : 0;
  const progress = goal ? Math.min(100, Math.round((totalCalories / goal) * 100)) : 0;

  workoutCount.textContent = String(workouts.length);
  calorieTotal.textContent = String(totalCalories);
  goalStatus.textContent = `${progress}%`;
}

async function getAllAccounts() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const request = getStore(db, ACCOUNTS_STORE).getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadAccounts() {
  const accounts = await getAllAccounts();
  renderAccountEntries(accounts);
  return accounts;
}

async function saveAccount(email, password) {
  const db = await openDatabase();
  const passwordHash = await hashValue(password);

  return new Promise((resolve, reject) => {
    const request = getStore(db, ACCOUNTS_STORE, "readwrite").add({
      email,
      passwordHash,
      createdAt: Date.now(),
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getAccountByEmail(email) {
  const accounts = await getAllAccounts();
  return accounts.find((entry) => entry.email.toLowerCase() === email.toLowerCase()) || null;
}

async function clearAccounts() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const request = getStore(db, ACCOUNTS_STORE, "readwrite").clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getFitnessEntriesByEmail(email) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const request = getStore(db, FITNESS_STORE).getAll();

    request.onsuccess = () => {
      const entries = request.result.filter((entry) => entry.email.toLowerCase() === email.toLowerCase());
      resolve(entries);
    };

    request.onerror = () => reject(request.error);
  });
}

async function saveFitnessEntry(entry) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const request = getStore(db, FITNESS_STORE, "readwrite").add(entry);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function setSession(email) {
  currentUser = email;
  localStorage.setItem(SESSION_KEY, email);
}

function clearSession() {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
}

async function refreshDashboard() {
  if (!currentUser) {
    return;
  }

  const entries = await getFitnessEntriesByEmail(currentUser);
  latestDashboardEntries = entries
    .slice()
    .sort((left, right) => right.createdAt - left.createdAt);
  welcomeText.textContent = `Willkommen zurueck, ${currentUser}. Trage heute dein Training und deine Mahlzeiten ein.`;
  renderWorkoutEntries(latestDashboardEntries);
  renderMealEntries(latestDashboardEntries);
  updateDashboardStats(latestDashboardEntries);
}

function showDashboard() {
  authView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  resetCoachChat();
}

function showAuthView() {
  dashboardView.classList.add("hidden");
  authView.classList.remove("hidden");
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = registerForm.email.value.trim();
  const password = registerForm.password.value.trim();

  resetMessage(registerMessage);
  resetMessage(loginMessage);

  if (!email || !password) {
    showMessage(registerMessage, "Bitte fuelle alle Felder aus.", "error");
    return;
  }

  try {
    const existingAccount = await getAccountByEmail(email);

    if (existingAccount) {
      showMessage(registerMessage, "Diese E-Mail ist bereits registriert.", "error");
      return;
    }

    await saveAccount(email, password);
    await loadAccounts();
    registerForm.reset();
    showMessage(registerMessage, `Konto fuer ${email} wurde erstellt.`, "success");
  } catch (error) {
    console.error(error);
    showMessage(registerMessage, "Registrierung fehlgeschlagen. Bitte versuche es erneut.", "error");
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = loginForm.email.value.trim();
  const password = loginForm.password.value.trim();

  resetMessage(registerMessage);
  resetMessage(loginMessage);

  if (!email || !password) {
    showMessage(loginMessage, "Bitte fuelle alle Felder aus.", "error");
    return;
  }

  try {
    const account = await getAccountByEmail(email);

    if (!account) {
      showMessage(loginMessage, "Kein Konto mit dieser E-Mail gefunden.", "error");
      return;
    }

    const enteredPasswordHash = await hashValue(password);

    if (account.passwordHash !== enteredPasswordHash) {
      showMessage(loginMessage, "Das Passwort ist nicht korrekt.", "error");
      return;
    }

    setSession(email);
    loginForm.reset();
    resetMessage(loginMessage);
    showDashboard();
    await refreshDashboard();
  } catch (error) {
    console.error(error);
    showMessage(loginMessage, "Anmeldung fehlgeschlagen. Bitte versuche es erneut.", "error");
  }
});

workoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    showMessage(workoutMessage, "Bitte melde dich zuerst an.", "error");
    return;
  }

  const name = workoutForm.name.value.trim();
  const duration = Number(workoutForm.duration.value);
  const notes = workoutForm.notes.value.trim();

  if (!name || !duration) {
    showMessage(workoutMessage, "Bitte fuelle Workout und Dauer aus.", "error");
    return;
  }

  try {
    await saveFitnessEntry({
      email: currentUser,
      type: "workout",
      name,
      duration,
      notes,
      createdAt: Date.now(),
    });

    workoutForm.reset();
    await refreshDashboard();
    showMessage(workoutMessage, "Workout gespeichert.", "success");
  } catch (error) {
    console.error(error);
    showMessage(workoutMessage, "Workout konnte nicht gespeichert werden.", "error");
  }
});

calorieForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    showMessage(calorieMessage, "Bitte melde dich zuerst an.", "error");
    return;
  }

  const meal = calorieForm.meal.value.trim();
  const calories = Number(calorieForm.calories.value);
  const goal = calorieForm.goal.value ? Number(calorieForm.goal.value) : 0;

  if (!meal || !calories) {
    showMessage(calorieMessage, "Bitte fuelle Mahlzeit und Kalorien aus.", "error");
    return;
  }

  try {
    await saveFitnessEntry({
      email: currentUser,
      type: "meal",
      meal,
      calories,
      goal,
      dateKey: formatCurrentDateKey(),
      createdAt: Date.now(),
    });

    calorieForm.reset();
    await refreshDashboard();
    showMessage(calorieMessage, "Kalorien gespeichert.", "success");
  } catch (error) {
    console.error(error);
    showMessage(calorieMessage, "Kalorien konnten nicht gespeichert werden.", "error");
  }
});

clearEntriesButton.addEventListener("click", async () => {
  resetMessage(registerMessage);
  resetMessage(loginMessage);

  try {
    await clearAccounts();
    await loadAccounts();
    showMessage(registerMessage, "Alle gespeicherten Konten wurden entfernt.", "success");
  } catch (error) {
    console.error(error);
    showMessage(registerMessage, "Die Konten konnten nicht geloescht werden.", "error");
  }
});

logoutButton.addEventListener("click", () => {
  clearSession();
  showAuthView();
  resetMessage(workoutMessage);
  resetMessage(calorieMessage);
  latestDashboardEntries = [];
  resetCoachChat();
});

apiConfigForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const model = modelSelect.value;

  localStorage.setItem(OPENAI_MODEL_STORAGE, model);
  updateApiModeBadge();
  showMessage(
    apiConfigMessage,
    "Modell gespeichert. Nach dem Deploy nutzt der Coach dieses Modell ueber den Server.",
    "success"
  );
});

coachForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = coachForm.question.value.trim();

  if (!question) {
    return;
  }

  appendChatMessage("user", question);
  coachForm.reset();

  try {
    const reply = await askOpenAI(question, latestDashboardEntries);

    appendChatMessage("assistant", reply);
    updateApiModeBadge();
  } catch (error) {
    console.error(error);
    const fallbackReply = createCoachReply(question, latestDashboardEntries);
    appendChatMessage(
      "assistant",
      `${fallbackReply} Hinweis: Der OpenAI-Aufruf hat nicht funktioniert, deshalb antworte ich gerade mit dem lokalen Coach.`
    );
    showMessage(apiConfigMessage, formatOpenAIError(error), "error");
    updateApiModeBadge();
  }
});

async function initialize() {
  try {
    initializeApiSettings();
    await loadAccounts();

    const sessionUser = localStorage.getItem(SESSION_KEY);

    if (sessionUser) {
      setSession(sessionUser);
      showDashboard();
      await refreshDashboard();
      return;
    }

    showAuthView();
  } catch (error) {
    console.error(error);
    showMessage(registerMessage, "Die Datenbank konnte nicht geladen werden.", "error");
  }
}

initialize();
