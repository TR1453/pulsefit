import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://myhqfkksvpmoqszrxxzi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_0k4oA72No7iMP_nLy-A64w_Of4pnwgC";
const BOSS_EMAIL = "emirchanoezer@gmail.com";
const DEFAULT_THEME = "ember";
const THEME_STORAGE_KEY = "pulsefit_theme";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const profileForm = document.getElementById("profileForm");
const workoutForm = document.getElementById("workoutForm");
const calorieForm = document.getElementById("calorieForm");
const coachForm = document.getElementById("coachForm");

const registerPanel = document.getElementById("registerPanel");
const loginPanel = document.getElementById("loginPanel");
const showRegisterButton = document.getElementById("showRegisterButton");
const showLoginButton = document.getElementById("showLoginButton");

const registerMessage = document.getElementById("registerMessage");
const loginMessage = document.getElementById("loginMessage");
const profileMessage = document.getElementById("profileMessage");
const workoutMessage = document.getElementById("workoutMessage");
const calorieMessage = document.getElementById("calorieMessage");

const workoutList = document.getElementById("workoutList");
const mealList = document.getElementById("mealList");
const coachChat = document.getElementById("coachChat");
const themeSelect = document.getElementById("themeSelect");

const logoutButton = document.getElementById("logoutButton");
const bossBanner = document.getElementById("bossBanner");
const bossPanel = document.getElementById("bossPanel");
const bossText = document.getElementById("bossText");
const bossUserEmail = document.getElementById("bossUserEmail");
const bossLogStatus = document.getElementById("bossLogStatus");

const authView = document.getElementById("authView");
const dashboardView = document.getElementById("dashboardView");
const welcomeText = document.getElementById("welcomeText");
const workoutCount = document.getElementById("workoutCount");
const calorieTotal = document.getElementById("calorieTotal");
const goalStatus = document.getElementById("goalStatus");

let currentUser = null;
let latestDashboardEntries = [];
let currentProfile = null;

function parseOptionalNumber(value) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalAge(value) {
  const parsed = parseOptionalNumber(value);
  return parsed ? Math.trunc(parsed) : null;
}

function validatePassword(password) {
  if (password.length < 8) {
    return "Das Passwort braucht mindestens 8 Zeichen.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Das Passwort braucht mindestens einen Grossbuchstaben.";
  }

  if (!/[a-z]/.test(password)) {
    return "Das Passwort braucht mindestens einen Kleinbuchstaben.";
  }

  if (!/[0-9]/.test(password)) {
    return "Das Passwort braucht mindestens eine Zahl.";
  }

  return "";
}

function applyTheme(theme) {
  const safeTheme = ["ember", "ocean", "forest"].includes(theme) ? theme : DEFAULT_THEME;
  document.body.dataset.theme = safeTheme;

  if (themeSelect) {
    themeSelect.value = safeTheme;
  }

  localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
}

function buildDisplayName(profile) {
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();

  if (fullName) {
    return fullName;
  }

  const fallbackFirstName = currentUser?.user_metadata?.first_name?.trim();
  return fallbackFirstName || currentUser?.email || "Athlet";
}

function buildProfileMetadata() {
  const metadata = currentUser?.user_metadata || {};
  const age = parseOptionalAge(metadata.age);

  return {
    first_name: typeof metadata.first_name === "string" ? metadata.first_name.trim() || null : null,
    last_name: typeof metadata.last_name === "string" ? metadata.last_name.trim() || null : null,
    age: age && age >= 12 && age <= 100 ? age : null,
  };
}

function isBossUser() {
  return currentUser?.email?.toLowerCase() === BOSS_EMAIL;
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

function formatWeightDifference(currentWeight, targetWeight) {
  if (!currentWeight || !targetWeight) {
    return "-";
  }

  const difference = Math.abs(currentWeight - targetWeight).toFixed(1);
  return `${difference} kg`;
}

function renderEmptyState(list, text) {
  list.innerHTML = "";
  const item = document.createElement("li");
  item.className = "empty-state";
  item.textContent = text;
  list.appendChild(item);
}

function fillProfileForm(profile) {
  profileForm.firstName.value = profile?.first_name ?? currentUser?.user_metadata?.first_name ?? "";
  profileForm.lastName.value = profile?.last_name ?? currentUser?.user_metadata?.last_name ?? "";
  profileForm.age.value = profile?.age ?? currentUser?.user_metadata?.age ?? "";
  profileForm.currentWeight.value = profile?.current_weight ?? "";
  profileForm.targetWeight.value = profile?.target_weight ?? "";
  profileForm.dailyCalorieGoal.value = profile?.daily_calorie_goal ?? "";
  profileForm.focus.value = profile?.focus ?? "";
}

function createEntryElement(entry, titleText, metaText, extraText) {
  const item = document.createElement("li");
  item.className = "entry";
  item.dataset.entryId = String(entry.id);

  const header = document.createElement("div");
  header.className = "entry-header";

  const title = document.createElement("strong");
  title.textContent = titleText;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "entry-delete";
  deleteButton.textContent = "Loeschen";
  deleteButton.dataset.entryId = String(entry.id);

  header.append(title, deleteButton);

  const meta = document.createElement("span");
  meta.textContent = metaText;

  const extra = document.createElement("span");
  extra.textContent = extraText;

  item.append(header, meta, extra);
  return item;
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
    workoutList.appendChild(
      createEntryElement(
        entry,
        entry.name,
        `${entry.duration} Minuten am ${formatDate(entry.created_at)}`,
        entry.notes || "Keine Notizen gespeichert."
      )
    );
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
    mealList.appendChild(
      createEntryElement(
        entry,
        entry.meal,
        `${entry.calories} kcal um ${formatDate(entry.created_at)}`,
        entry.goal ? `Tagesziel: ${entry.goal} kcal` : "Kein Tagesziel eingetragen."
      )
    );
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
    "Hallo, ich bin dein PulseFit Coach. Frag mich nach Muskelaufbau, Fettabbau, Protein, Trainingsroutine oder wie du dein Gewichtsziel erreichst."
  );
}

function buildUserSummary(entries, profile) {
  const workouts = entries.filter((entry) => entry.type === "workout");
  const todaysMeals = entries.filter(
    (entry) => entry.type === "meal" && entry.date_key === formatCurrentDateKey()
  );
  const totalCalories = todaysMeals.reduce((sum, entry) => sum + entry.calories, 0);
  const latestGoalEntry = todaysMeals.find((entry) => entry.goal);
  const calorieGoal = latestGoalEntry?.goal || profile?.daily_calorie_goal || 0;

  return {
    firstName: profile?.first_name || currentUser?.user_metadata?.first_name || "",
    lastName: profile?.last_name || currentUser?.user_metadata?.last_name || "",
    age: profile?.age || currentUser?.user_metadata?.age || null,
    workouts: workouts.length,
    totalCalories,
    calorieGoal,
    currentWeight: profile?.current_weight || null,
    targetWeight: profile?.target_weight || null,
    focus: profile?.focus || "",
  };
}

function createCoachReply(question, entries, profile) {
  const normalized = question.trim().toLowerCase();
  const summary = buildUserSummary(entries, profile);
  const focusText = summary.focus ? ` Dein aktueller Fokus ist ${summary.focus}.` : "";

  if (normalized.includes("protein") || normalized.includes("eiweiss")) {
    return `Fuer Muskelaufbau sind oft etwa 1,6 bis 2,2 Gramm Protein pro Kilogramm Koerpergewicht sinnvoll.${focusText}`;
  }

  if (normalized.includes("abnehmen") || normalized.includes("defizit") || normalized.includes("fett")) {
    const goalHint = summary.calorieGoal
      ? ` Du hast aktuell ein Kalorienziel von ${summary.calorieGoal} kcal eingetragen.`
      : " Trage am besten dein Kalorienziel im Profil ein.";
    return `Fuer Fettabbau helfen ein moderates Defizit, regelmaessiges Krafttraining und genug Protein.${goalHint}${focusText}`;
  }

  if (normalized.includes("gewicht") || normalized.includes("zielgewicht")) {
    if (summary.currentWeight && summary.targetWeight) {
      return `Du liegst aktuell bei ${summary.currentWeight} kg und willst auf ${summary.targetWeight} kg. Konzentriere dich auf einen klaren Plan aus Training, Kalorienziel und Kontinuitaet.`;
    }

    return "Trage im Profil dein aktuelles Gewicht und dein Zielgewicht ein, dann kann ich dir gezielter helfen.";
  }

  if (normalized.includes("plan") || normalized.includes("trainingsplan") || normalized.includes("routine")) {
    return "Ein guter Start ist 3-mal pro Woche Ganzkoerper oder 4-mal pro Woche Oberkoerper-Unterkoerper. Wichtiger als ein perfekter Split ist, dass du ihn konstant durchziehst.";
  }

  if (normalized.includes("heute") || normalized.includes("fortschritt") || normalized.includes("status")) {
    return `Heute hast du ${summary.workouts} Workouts gespeichert und ${summary.totalCalories} kcal getrackt.${focusText}`;
  }

  return `Mein Tipp: kombiniere Training, ein klares Kalorienziel, ausreichend Schlaf und ein gepflegtes Profil mit Gewicht und Zielgewicht.${focusText}`;
}

function buildOpenAIContext(entries, profile) {
  const summary = buildUserSummary(entries, profile);

  return [
    `Benutzer: ${currentUser?.email || "unbekannt"}`,
    `Name: ${[summary.firstName, summary.lastName].filter(Boolean).join(" ") || "nicht gesetzt"}`,
    `Alter: ${summary.age || "nicht gesetzt"}`,
    `Workouts: ${summary.workouts}`,
    `Kalorien heute: ${summary.totalCalories}`,
    `Kalorienziel: ${summary.calorieGoal || "nicht gesetzt"}`,
    `Aktuelles Gewicht: ${summary.currentWeight || "nicht gesetzt"}`,
    `Zielgewicht: ${summary.targetWeight || "nicht gesetzt"}`,
    `Fokus: ${summary.focus || "nicht gesetzt"}`,
  ].join("\n");
}

async function askOpenAI(question, entries, profile) {
  const response = await fetch("/api/coach", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      instructions:
        "Du bist ein hilfreicher deutschsprachiger Fitness-Coach in einer Fitness-App. Antworte klar, konkret, motivierend und praxisnah.",
      input: `App-Kontext:\n${buildOpenAIContext(entries, profile)}\n\nFrage des Nutzers:\n${question}`,
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

async function logSecurityEvent({ email, eventType, status, detail }) {
  try {
    await fetch("/api/security-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, eventType, status, detail }),
    });
  } catch (error) {
    console.error("Security log failed", error);
  }
}

async function getProfile() {
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function saveProfile(profile) {
  const { error } = await supabase.from("profiles").upsert(profile);

  if (error) {
    throw error;
  }
}

async function ensureProfileRecord() {
  const profile = await getProfile();
  const metadataProfile = buildProfileMetadata();

  if (!profile) {
    const initialProfile = {
      user_id: currentUser.id,
      first_name: metadataProfile.first_name,
      last_name: metadataProfile.last_name,
      age: metadataProfile.age,
      current_weight: null,
      target_weight: null,
      daily_calorie_goal: null,
      focus: null,
    };

    await saveProfile(initialProfile);
    return initialProfile;
  }

  const shouldPatchFromMetadata =
    (!profile.first_name && metadataProfile.first_name) ||
    (!profile.last_name && metadataProfile.last_name) ||
    (!profile.age && metadataProfile.age);

  if (shouldPatchFromMetadata) {
    const mergedProfile = {
      ...profile,
      user_id: currentUser.id,
      first_name: profile.first_name || metadataProfile.first_name,
      last_name: profile.last_name || metadataProfile.last_name,
      age: profile.age || metadataProfile.age,
    };

    await saveProfile(mergedProfile);
    return mergedProfile;
  }

  return profile;
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
  const { error } = await supabase.from("fitness_entries").insert({
    ...entry,
    user_id: currentUser.id,
  });

  if (error) {
    throw error;
  }
}

async function deleteFitnessEntry(id) {
  const { error } = await supabase
    .from("fitness_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", currentUser.id);

  if (error) {
    throw error;
  }
}

function updateDashboardStats(entries, profile) {
  const workouts = entries.filter((entry) => entry.type === "workout");
  const todaysMeals = entries.filter(
    (entry) => entry.type === "meal" && entry.date_key === formatCurrentDateKey()
  );
  const totalCalories = todaysMeals.reduce((sum, entry) => sum + entry.calories, 0);

  workoutCount.textContent = String(workouts.length);
  calorieTotal.textContent = String(totalCalories);
  goalStatus.textContent = formatWeightDifference(profile?.current_weight, profile?.target_weight);
}

function updateBossView(entries) {
  if (!isBossUser()) {
    bossBanner.classList.add("hidden");
    bossPanel.classList.add("hidden");
    return;
  }

  bossBanner.classList.remove("hidden");
  bossPanel.classList.remove("hidden");
  bossUserEmail.textContent = currentUser.email;
  bossLogStatus.textContent = `${entries.length} Eintraege`;
  bossText.textContent = `Hallo Chef ${buildDisplayName(currentProfile)}. Du hast den erweiterten Bereich mit besonderer Uebersicht, persoenlicher Begruessung und schnellerem Zugriff.`;
}

async function refreshDashboard() {
  if (!currentUser) {
    return;
  }

  const [profile, entries] = await Promise.all([ensureProfileRecord(), getFitnessEntries()]);
  currentProfile = profile;
  latestDashboardEntries = entries;
  const displayName = buildDisplayName(profile);

  fillProfileForm(currentProfile);
  welcomeText.textContent = isBossUser()
    ? `Hallo Chef ${displayName}. Deine PulseFit Zentrale ist bereit.`
    : `Willkommen zurueck, ${displayName}. Dein Profil und deine Fitnessdaten sind online gespeichert.`;

  renderWorkoutEntries(entries);
  renderMealEntries(entries);
  updateDashboardStats(entries, profile);
  updateBossView(entries);
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

  currentProfile = null;
  latestDashboardEntries = [];
  showAuthView();
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetMessage(registerMessage);
  resetMessage(loginMessage);

  const firstName = registerForm.firstName.value.trim();
  const lastName = registerForm.lastName.value.trim();
  const age = parseOptionalAge(registerForm.age.value);
  const email = registerForm.email.value.trim();
  const password = registerForm.password.value;

  if (!firstName || !lastName || !age || !email || !password) {
    showMessage(registerMessage, "Bitte fuelle alle Felder aus.", "error");
    return;
  }

  if (age < 12 || age > 100) {
    showMessage(registerMessage, "Bitte gib ein realistisches Alter zwischen 12 und 100 ein.", "error");
    return;
  }

  const passwordValidationMessage = validatePassword(password);

  if (passwordValidationMessage) {
    showMessage(registerMessage, passwordValidationMessage, "error");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          age,
        },
      },
    });

    if (error) {
      await logSecurityEvent({ email, eventType: "register", status: "failed", detail: error.message });
      showMessage(registerMessage, error.message, "error");
      return;
    }

    if (data.session?.user) {
      try {
        await saveProfile({
          user_id: data.session.user.id,
          first_name: firstName,
          last_name: lastName,
          age,
          current_weight: null,
          target_weight: null,
          daily_calorie_goal: null,
          focus: null,
        });
      } catch (profileError) {
        console.error(profileError);
      }
    }

    await logSecurityEvent({ email, eventType: "register", status: "success", detail: "Supabase signUp accepted" });
    registerForm.reset();
    applyTheme(document.body.dataset.theme || DEFAULT_THEME);
    showMessage(
      registerMessage,
      "Konto erstellt. Falls E-Mail-Bestaetigung aktiv ist, bestaetige zuerst deine E-Mail.",
      "success"
    );
  } catch (error) {
    console.error(error);
    showMessage(registerMessage, "Registrierung fehlgeschlagen. Bitte pruefe Supabase oder dein Netzwerk.", "error");
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetMessage(registerMessage);
  resetMessage(loginMessage);

  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;

  if (!email || !password) {
    showMessage(loginMessage, "Bitte fuelle alle Felder aus.", "error");
    return;
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      await logSecurityEvent({ email, eventType: "login", status: "failed", detail: error.message });
      showMessage(loginMessage, error.message, "error");
      return;
    }

    await logSecurityEvent({ email, eventType: "login", status: "success", detail: "Supabase signInWithPassword succeeded" });
    loginForm.reset();
  } catch (error) {
    console.error(error);
    showMessage(loginMessage, "Login fehlgeschlagen. Bitte pruefe Supabase oder dein Netzwerk.", "error");
  }
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    showMessage(profileMessage, "Bitte melde dich zuerst an.", "error");
    return;
  }

  const firstName = profileForm.firstName.value.trim();
  const lastName = profileForm.lastName.value.trim();
  const age = parseOptionalAge(profileForm.age.value);

  if (profileForm.age.value && (!age || age < 12 || age > 100)) {
    showMessage(profileMessage, "Bitte gib ein realistisches Alter zwischen 12 und 100 ein.", "error");
    return;
  }

  try {
    await saveProfile({
      user_id: currentUser.id,
      first_name: firstName || null,
      last_name: lastName || null,
      age,
      current_weight: parseOptionalNumber(profileForm.currentWeight.value),
      target_weight: parseOptionalNumber(profileForm.targetWeight.value),
      daily_calorie_goal: parseOptionalNumber(profileForm.dailyCalorieGoal.value),
      focus: profileForm.focus.value.trim() || null,
    });

    await refreshDashboard();
    showMessage(profileMessage, "Profil gespeichert.", "success");
  } catch (error) {
    console.error(error);
    showMessage(profileMessage, error.message || "Profil konnte nicht gespeichert werden.", "error");
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
      type: "workout",
      name,
      duration,
      notes: notes || null,
    });

    workoutForm.reset();
    await refreshDashboard();
    showMessage(workoutMessage, "Workout gespeichert.", "success");
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
  const goal = calorieForm.goal.value
    ? Number(calorieForm.goal.value)
    : currentProfile?.daily_calorie_goal || null;

  if (!meal || !calories) {
    showMessage(calorieMessage, "Bitte fuelle Mahlzeit und Kalorien aus.", "error");
    return;
  }

  try {
    await saveFitnessEntry({
      type: "meal",
      meal,
      calories,
      goal,
      date_key: formatCurrentDateKey(),
    });

    calorieForm.reset();
    await refreshDashboard();
    showMessage(calorieMessage, "Kalorien gespeichert.", "success");
  } catch (error) {
    console.error(error);
    showMessage(calorieMessage, error.message || "Kalorien konnten nicht gespeichert werden.", "error");
  }
});

async function handleDeleteClick(event, source) {
  const deleteButton = event.target.closest(".entry-delete");

  if (!deleteButton) {
    return;
  }

  const entryId = Number(deleteButton.dataset.entryId);

  if (!entryId) {
    return;
  }

  try {
    await deleteFitnessEntry(entryId);
    await refreshDashboard();
    showMessage(
      source === "workout" ? workoutMessage : calorieMessage,
      "Eintrag geloescht.",
      "success"
    );
  } catch (error) {
    console.error(error);
    showMessage(
      source === "workout" ? workoutMessage : calorieMessage,
      error.message || "Eintrag konnte nicht geloescht werden.",
      "error"
    );
  }
}

workoutList.addEventListener("click", (event) => {
  handleDeleteClick(event, "workout");
});

mealList.addEventListener("click", (event) => {
  handleDeleteClick(event, "meal");
});

logoutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
  resetMessage(profileMessage);
  resetMessage(workoutMessage);
  resetMessage(calorieMessage);
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

themeSelect.addEventListener("change", (event) => {
  applyTheme(event.target.value);
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
    const reply = await askOpenAI(question, latestDashboardEntries, currentProfile);
    appendChatMessage("assistant", reply);
  } catch (error) {
    console.error(error);
    appendChatMessage("assistant", createCoachReply(question, latestDashboardEntries, currentProfile));
  }
});

async function initialize() {
  try {
    applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME);

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
