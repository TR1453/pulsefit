import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://myhqfkksvpmoqszrxxzi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_0k4oA72No7iMP_nLy-A64w_Of4pnwgC";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const workoutForm = document.getElementById("workoutForm");
const calorieForm = document.getElementById("calorieForm");
const coachForm = document.getElementById("coachForm");
const registerPanel = document.getElementById("registerPanel");
const loginPanel = document.getElementById("loginPanel");
const showRegisterButton = document.getElementById("showRegisterButton");
const showLoginButton = document.getElementById("showLoginButton");

const registerMessage = document.getElementById("registerMessage");
const loginMessage = document.getElementById("loginMessage");
const workoutMessage = document.getElementById("workoutMessage");
const calorieMessage = document.getElementById("calorieMessage");

const workoutList = document.getElementById("workoutList");
const mealList = document.getElementById("mealList");
const coachChat = document.getElementById("coachChat");

const logoutButton = document.getElementById("logoutButton");
const bossBanner = document.getElementById("bossBanner");
const bossPanel = document.getElementById("bossPanel");
const bossText = document.getElementById("bossText");
const bossUserEmail = document.getElementById("bossUserEmail");

const authView = document.getElementById("authView");
const dashboardView = document.getElementById("dashboardView");
const welcomeText = document.getElementById("welcomeText");
const workoutCount = document.getElementById("workoutCount");
const calorieTotal = document.getElementById("calorieTotal");
const goalStatus = document.getElementById("goalStatus");

const BOSS_EMAIL = "emirchanoezer@gmail.com";

let currentUser = null;
let latestDashboardEntries = [];

function isBossUser() {
  return currentUser?.email?.toLowerCase() === BOSS_EMAIL;
}

function updateBossView() {
  if (!isBossUser()) {
    bossBanner.classList.add("hidden");
    bossPanel.classList.add("hidden");
    return;
  }

  bossBanner.classList.remove("hidden");
  bossPanel.classList.remove("hidden");
  bossUserEmail.textContent = currentUser.email;
  bossText.textContent = "Hallo Chef. Du siehst hier deine besondere Oberflaeche mit erweitertem Zugriff und schnellerem Ueberblick ueber deine App.";
}

async function logSecurityEvent({ email, eventType, status, detail }) {
  try {
    await fetch("/api/security-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        eventType,
        status,
        detail,
      }),
    });
  } catch (error) {
    console.error("Security log failed", error);
  }
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

function renderWorkoutEntries(entries) {
  workoutList.innerHTML = "";

  const workouts = entries
    .filter((entry) => entry.type === "workout")
    .sort((left, right) => new Date(right.created_at) - new Date(left.created_at));

  if (!workouts.length) {
    renderEmptyState(workoutList, "Noch keine Workouts gespeichert.");
    return;
  }

  workouts.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "entry";

    const title = document.createElement("strong");
    title.textContent = entry.name;

    const meta = document.createElement("span");
    meta.textContent = `${entry.duration} Minuten am ${formatDate(entry.created_at)}`;

    const notes = document.createElement("span");
    notes.textContent = entry.notes ? entry.notes : "Keine Notizen gespeichert.";

    item.append(title, meta, notes);
    workoutList.appendChild(item);
  });
}

function renderMealEntries(entries) {
  mealList.innerHTML = "";

  const todaysMeals = entries
    .filter((entry) => entry.type === "meal" && entry.date_key === formatCurrentDateKey())
    .sort((left, right) => new Date(right.created_at) - new Date(left.created_at));

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
    meta.textContent = `${entry.calories} kcal um ${formatDate(entry.created_at)}`;

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

function buildUserSummary(entries) {
  const workouts = entries.filter((entry) => entry.type === "workout");
  const todaysMeals = entries.filter(
    (entry) => entry.type === "meal" && entry.date_key === formatCurrentDateKey()
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

  if (normalized.includes("eiweiss") || normalized.includes("protein")) {
    return `${personalizedNote} Fuer Muskelaufbau sind oft etwa 1,6 bis 2,2 Gramm Protein pro Kilogramm Koerpergewicht pro Tag sinnvoll.`;
  }

  if (normalized.includes("abnehmen") || normalized.includes("fett") || normalized.includes("defizit")) {
    return `${personalizedNote} Fuer Fettabbau ist ein moderates Kaloriendefizit meistens nachhaltiger als extremes Hungern.`;
  }

  if (normalized.includes("muskel") || normalized.includes("muskelaufbau")) {
    return `${personalizedNote} Fuer Muskelaufbau helfen ein leichter Kalorienueberschuss, progressive Steigerung im Training und genug Schlaf.`;
  }

  if (normalized.includes("heute") || normalized.includes("status")) {
    return `${personalizedNote} Dein letzter Fortschritt wird direkt aus deinen gespeicherten Daten geladen.`;
  }

  return `${personalizedNote} Kombiniere Krafttraining, genug Protein, ein klares Kalorienziel und ausreichend Schlaf.`;
}

function buildOpenAIContext(entries) {
  const summary = buildUserSummary(entries);
  const workouts = entries
    .filter((entry) => entry.type === "workout")
    .slice(0, 3)
    .map((entry) => `${entry.name} (${entry.duration} Min)`)
    .join(", ");
  const meals = entries
    .filter((entry) => entry.type === "meal" && entry.date_key === formatCurrentDateKey())
    .slice(0, 5)
    .map((entry) => `${entry.meal} (${entry.calories} kcal)`)
    .join(", ");

  return [
    `Benutzer: ${currentUser?.email || "unbekannt"}`,
    `Workouts gesamt: ${summary.workouts}`,
    `Kalorien heute: ${summary.totalCalories}`,
    `Kalorienziel heute: ${summary.goal || "nicht gesetzt"}`,
    `Letzte Workouts: ${workouts || "keine"}`,
    `Heutige Mahlzeiten: ${meals || "keine"}`,
  ].join("\n");
}

async function askOpenAI(question, entries) {
  const response = await fetch("/api/coach", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      instructions:
        "Du bist ein hilfreicher deutschsprachiger Fitness-Coach in einer Fitness-App. Antworte klar, motivierend und kurz. Gib keine medizinischen Diagnosen.",
      input: `App-Kontext:\n${buildOpenAIContext(entries)}\n\nFrage des Nutzers:\n${question}`,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();

  if (data.output_text?.trim()) {
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

function updateDashboardStats(entries) {
  const workouts = entries.filter((entry) => entry.type === "workout");
  const todaysMeals = entries.filter(
    (entry) => entry.type === "meal" && entry.date_key === formatCurrentDateKey()
  );

  const totalCalories = todaysMeals.reduce((sum, entry) => sum + entry.calories, 0);
  const latestGoalEntry = todaysMeals.find((entry) => entry.goal);
  const goal = latestGoalEntry ? latestGoalEntry.goal : 0;
  const progress = goal ? Math.min(100, Math.round((totalCalories / goal) * 100)) : 0;

  workoutCount.textContent = String(workouts.length);
  calorieTotal.textContent = String(totalCalories);
  goalStatus.textContent = `${progress}%`;
}

async function getFitnessEntries() {
  const { data, error } = await supabase
    .from("fitness_entries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

async function saveFitnessEntry(entry) {
  const { error } = await supabase.from("fitness_entries").insert(entry);

  if (error) {
    throw error;
  }
}

async function refreshDashboard() {
  if (!currentUser) {
    return;
  }

  latestDashboardEntries = await getFitnessEntries();
  welcomeText.textContent = isBossUser()
    ? `Hallo Chef ${currentUser.email}. Deine Daten sind online gespeichert und dein Sonderbereich ist aktiv.`
    : `Willkommen zurueck, ${currentUser.email}. Deine Daten sind jetzt online gespeichert.`;
  renderWorkoutEntries(latestDashboardEntries);
  renderMealEntries(latestDashboardEntries);
  updateDashboardStats(latestDashboardEntries);
  updateBossView();
}

function showDashboard() {
  authView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  resetCoachChat();
}

function showRegisterPanel() {
  loginPanel.classList.add("hidden");
  registerPanel.classList.remove("hidden");
}

function showLoginPanel() {
  registerPanel.classList.add("hidden");
  loginPanel.classList.remove("hidden");
}

function showAuthView() {
  dashboardView.classList.add("hidden");
  authView.classList.remove("hidden");
  showLoginPanel();
  bossBanner.classList.add("hidden");
  bossPanel.classList.add("hidden");
}

async function handleSession(session) {
  currentUser = session?.user || null;

  if (currentUser) {
    showDashboard();
    await refreshDashboard();
    return;
  }

  showAuthView();
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetMessage(registerMessage);
  resetMessage(loginMessage);

  const email = registerForm.email.value.trim();
  const password = registerForm.password.value.trim();

  if (!email || !password) {
    showMessage(registerMessage, "Bitte fuelle alle Felder aus.", "error");
    return;
  }

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      await logSecurityEvent({
        email,
        eventType: "register",
        status: "failed",
        detail: error.message,
      });
      showMessage(registerMessage, error.message, "error");
      return;
    }

    await logSecurityEvent({
      email,
      eventType: "register",
      status: "success",
      detail: "Supabase signUp accepted",
    });

    registerForm.reset();
    showMessage(
      registerMessage,
      "Konto erstellt. Falls E-Mail-Bestaetigung aktiv ist, bestaetige zuerst deine E-Mail.",
      "success"
    );
  } catch (error) {
    console.error(error);
    await logSecurityEvent({
      email,
      eventType: "register",
      status: "failed",
      detail: error.message || "Unexpected register error",
    });
    showMessage(
      registerMessage,
      "Registrierung fehlgeschlagen. Bitte pruefe Internet, Supabase oder ob die aktuelle Version wirklich online ist.",
      "error"
    );
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetMessage(registerMessage);
  resetMessage(loginMessage);

  const email = loginForm.email.value.trim();
  const password = loginForm.password.value.trim();

  if (!email || !password) {
    showMessage(loginMessage, "Bitte fuelle alle Felder aus.", "error");
    return;
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await logSecurityEvent({
        email,
        eventType: "login",
        status: "failed",
        detail: error.message,
      });
      showMessage(loginMessage, error.message, "error");
      return;
    }

    await logSecurityEvent({
      email,
      eventType: "login",
      status: "success",
      detail: "Supabase signInWithPassword succeeded",
    });

    loginForm.reset();
  } catch (error) {
    console.error(error);
    await logSecurityEvent({
      email,
      eventType: "login",
      status: "failed",
      detail: error.message || "Unexpected login error",
    });
    showMessage(
      loginMessage,
      "Login fehlgeschlagen. Bitte pruefe Internet, Supabase oder ob die aktuelle Version wirklich online ist.",
      "error"
    );
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
      user_id: currentUser.id,
      type: "workout",
      name,
      duration,
      notes,
    });

    workoutForm.reset();
    await refreshDashboard();
    showMessage(workoutMessage, "Workout online gespeichert.", "success");
  } catch (error) {
    console.error(error);
    showMessage(workoutMessage, error.message || "Workout konnte nicht gespeichert werden.", "error");
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
      user_id: currentUser.id,
      type: "meal",
      meal,
      calories,
      goal,
      date_key: formatCurrentDateKey(),
    });

    calorieForm.reset();
    await refreshDashboard();
    showMessage(calorieMessage, "Kalorien online gespeichert.", "success");
  } catch (error) {
    console.error(error);
    showMessage(calorieMessage, error.message || "Kalorien konnten nicht gespeichert werden.", "error");
  }
});

logoutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
  resetMessage(workoutMessage);
  resetMessage(calorieMessage);
  latestDashboardEntries = [];
  resetCoachChat();
});

showRegisterButton.addEventListener("click", () => {
  resetMessage(loginMessage);
  resetMessage(registerMessage);
  showRegisterPanel();
});

showLoginButton.addEventListener("click", () => {
  resetMessage(loginMessage);
  resetMessage(registerMessage);
  showLoginPanel();
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
  } catch (error) {
    console.error(error);
    appendChatMessage(
      "assistant",
      `${createCoachReply(question, latestDashboardEntries)} Hinweis: Der OpenAI-Aufruf hat nicht funktioniert, deshalb antworte ich gerade mit dem lokalen Coach.`
    );
  }
});

async function initialize() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    await handleSession(session);

    supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      await handleSession(nextSession);
    });
  } catch (error) {
    console.error(error);
    showMessage(
      loginMessage,
      "Die Verbindung zu Supabase konnte nicht aufgebaut werden. Bitte pruefe deine Online-Version oder den Browser.",
      "error"
    );
  }
}

initialize();

window.addEventListener("error", (event) => {
  console.error(event.error || event.message);
  showMessage(
    loginMessage,
    "Ein JavaScript-Fehler hat die Seite blockiert. Bitte lade die Seite neu und pruefe, ob die aktuelle Version online ist.",
    "error"
  );
});

window.addEventListener("unhandledrejection", (event) => {
  console.error(event.reason);
  showMessage(
    loginMessage,
    "Eine Anfrage konnte nicht verarbeitet werden. Bitte pruefe Internet, Supabase und die aktuelle Deploy-Version.",
    "error"
  );
});
