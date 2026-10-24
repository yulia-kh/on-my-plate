const $ = (id) => document.getElementById(id);
const KEY = "on-my-plate-meals-v1";
let image = null;
let meals = [];
try {
  meals = JSON.parse(localStorage.getItem(KEY) || "[]");
  if (!Array.isArray(meals)) meals = [];
} catch {
  meals = [];
}
const status = (msg) => ($("status").textContent = msg);
function render() {
  const list = $("meals");
  list.replaceChildren();
  $("count").textContent =
    `${meals.length} meal${meals.length === 1 ? "" : "s"}`;
  $("empty").hidden = meals.length > 0;
  for (const meal of meals) {
    const li = document.createElement("li");
    li.className = "meal";
    if (meal.image) {
      const img = document.createElement("img");
      img.src = meal.image;
      img.alt = "Meal photo";
      li.append(img);
    }
    const details = document.createElement("div");
    details.className = "details";
    const name = document.createElement("strong");
    name.textContent = meal.name;
    const time = document.createElement("small");
    time.textContent = new Date(meal.date).toLocaleString();
    details.append(name, time);
    const del = document.createElement("button");
    del.className = "delete";
    del.textContent = "Delete";
    del.setAttribute("aria-label", `Delete ${meal.name}`);
    del.onclick = () => {
      if (!confirm("Delete this meal?")) return;
      meals = meals.filter((m) => m.id !== meal.id);
      persist();
      render();
    };
    li.append(details, del);
    list.append(li);
  }
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(meals));
    return true;
  } catch {
    status("Storage is full. Try a smaller photo or delete older meals.");
    return false;
  }
}
function resize(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image"));
    };
    img.src = url;
  });
}
$("photo").onchange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return status("Please choose an image.");
  try {
    image = await resize(file);
    $("preview").src = image;
    $("preview").hidden = false;
    $("identify").disabled = false;
    $("uploadText").textContent = "📷  Change photo";
    status("Photo ready. Identify with AI or type a name.");
  } catch {
    status("Could not open that photo. Try another.");
  }
};
$("identify").onclick = async () => {
  if (!image) return;
  const btn = $("identify");
  btn.disabled = true;
  btn.textContent = "Identifying…";
  status("Looking at your food…");
  try {
    const res = await fetch("/api/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Recognition failed");
    $("foodName").value = data.name;
    status("Please check and correct the name before saving.");
  } catch (e) {
    status(e.message + " You can still type the food name.");
  } finally {
    btn.disabled = false;
    btn.textContent = "✨ Identify food with AI";
  }
};
$("save").onclick = () => {
  const name = $("foodName").value.trim();
  if (!name) return status("Enter a food name first.");
  const entry = {
    id: crypto.randomUUID(),
    name,
    date: new Date().toISOString(),
    image,
  };
  meals.unshift(entry);
  if (!persist()) {
    meals.shift();
    return;
  }
  render();
  $("foodName").value = "";
  $("photo").value = "";
  $("preview").hidden = true;
  $("preview").removeAttribute("src");
  $("identify").disabled = true;
  $("uploadText").textContent = "📷  Take or choose a photo";
  image = null;
  status("Meal saved! ✓");
};
render();
