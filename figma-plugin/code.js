// DojoOS Activity Page — Figma Plugin
// Recreates the full workout-tab.tsx layout as editable Figma vector nodes

async function main() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Black" });

  const page = figma.currentPage;
  page.name = "Activity Page";

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  function hex(h) {
    const r = parseInt(h.slice(1, 3), 16) / 255;
    const g = parseInt(h.slice(3, 5), 16) / 255;
    const b = parseInt(h.slice(5, 7), 16) / 255;
    return { r, g, b };
  }

  function solidFill(h, a = 1) {
    return [{ type: "SOLID", color: hex(h), opacity: a }];
  }

  function noFill() { return []; }

  function stroke(h, weight = 1, a = 1) {
    return [{ type: "SOLID", color: hex(h), opacity: a }];
  }

  function vFrame(name, w, gap = 12, padH = 16, padV = 16) {
    const f = figma.createFrame();
    f.name = name;
    f.layoutMode = "VERTICAL";
    f.primaryAxisSizingMode = "AUTO";
    f.counterAxisSizingMode = w === "fill" ? "FIXED" : "AUTO";
    if (w !== "fill") f.resize(w, 10);
    f.itemSpacing = gap;
    f.paddingLeft = f.paddingRight = padH;
    f.paddingTop = f.paddingBottom = padV;
    f.fills = noFill();
    f.clipsContent = false;
    return f;
  }

  function hFrame(name, gap = 8, padH = 0, padV = 0) {
    const f = figma.createFrame();
    f.name = name;
    f.layoutMode = "HORIZONTAL";
    f.primaryAxisSizingMode = "AUTO";
    f.counterAxisSizingMode = "AUTO";
    f.itemSpacing = gap;
    f.paddingLeft = f.paddingRight = padH;
    f.paddingTop = f.paddingBottom = padV;
    f.fills = noFill();
    f.clipsContent = false;
    return f;
  }

  function card(name, w, fillColor = "#161616", borderColor = "#2a2a2a", radius = 16) {
    const f = vFrame(name, w, 12, 16, 16);
    f.fills = solidFill(fillColor);
    f.strokes = stroke(borderColor);
    f.strokeWeight = 1;
    f.cornerRadius = radius;
    return f;
  }

  function txt(content, size, weight, colorHex, align = "LEFT") {
    const t = figma.createText();
    t.characters = content;
    t.fontSize = size;
    t.fontName = { family: "Inter", style: weight };
    t.fills = solidFill(colorHex);
    t.textAlignHorizontal = align;
    return t;
  }

  function pill(label, bg, fg, radius = 8) {
    const f = hFrame("pill-" + label, 6, 10, 6);
    f.fills = solidFill(bg);
    f.cornerRadius = radius;
    f.counterAxisAlignItems = "CENTER";
    const t = txt(label, 11, "Semi Bold", fg);
    f.appendChild(t);
    return f;
  }

  function setFill(node, w) {
    node.layoutAlign = "STRETCH";
    node.layoutGrow = w === "fill" ? 1 : 0;
  }

  function spacer(h) {
    const f = figma.createFrame();
    f.name = "spacer";
    f.resize(1, h);
    f.fills = noFill();
    return f;
  }

  // ─── METRIC RING ────────────────────────────────────────────────────────────

  function metricRing(label, value, unit, sublabel, color, progress) {
    const container = vFrame("ring-" + label, 100, 6, 12, 16);
    container.fills = solidFill("#161616");
    container.strokes = stroke("#2a2a2a");
    container.strokeWeight = 1;
    container.cornerRadius = 16;
    container.counterAxisAlignItems = "CENTER";
    container.primaryAxisAlignItems = "CENTER";

    // SVG ring
    const D = 88, SW = 9, R = (D - SW) / 2;
    const circ = 2 * Math.PI * R;
    const cx = D / 2, cy = D / 2;
    const pct = Math.min(1, Math.max(0, progress));
    const offset = circ - pct * circ;

    const trackAngle = -90;
    const svgStr = `
<svg width="${D}" height="${D}" viewBox="0 0 ${D} ${D}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${color}" stroke-width="${SW}" stroke-opacity="0.18"
    transform="rotate(${trackAngle} ${cx} ${cy})" />
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${color}" stroke-width="${SW}"
    stroke-linecap="round"
    stroke-dasharray="${circ.toFixed(2)}"
    stroke-dashoffset="${offset.toFixed(2)}"
    transform="rotate(${trackAngle} ${cx} ${cy})" />
</svg>`.trim();

    const ringNode = figma.createNodeFromSvg(svgStr);
    ringNode.name = "ring-svg";
    ringNode.resize(D, D);

    // Center text overlay
    const centerGroup = vFrame("ring-center", D, 2, 0, 0);
    centerGroup.counterAxisAlignItems = "CENTER";
    centerGroup.primaryAxisAlignItems = "CENTER";
    centerGroup.resize(D, D);

    const valT = txt(String(value), 20, "Black", color, "CENTER");
    centerGroup.appendChild(valT);
    if (unit) {
      const unitT = txt(unit, 9, "Semi Bold", color + "99", "CENTER");
      centerGroup.appendChild(unitT);
    }

    // Stack ring + center using a relative frame
    const ringFrame = figma.createFrame();
    ringFrame.name = "ring-stack";
    ringFrame.resize(D, D);
    ringFrame.fills = noFill();
    ringFrame.clipsContent = false;
    ringFrame.appendChild(ringNode);
    ringFrame.appendChild(centerGroup);
    ringNode.x = 0; ringNode.y = 0;
    centerGroup.x = 0; centerGroup.y = 0;

    container.appendChild(ringFrame);

    // Labels
    const labelT = txt(label.toUpperCase(), 9, "Semi Bold", "#6b7280", "CENTER");
    container.appendChild(labelT);
    if (sublabel) {
      const subT = txt(sublabel, 9, "Regular", "#4b5563", "CENTER");
      container.appendChild(subT);
    }

    return container;
  }

  // ─── MAIN FRAME ─────────────────────────────────────────────────────────────

  const main = vFrame("Activity Page", 390, 20, 16, 16);
  main.fills = solidFill("#0a0a0a");
  main.clipsContent = false;

  // ─── 1. HEADER ──────────────────────────────────────────────────────────────

  const header = hFrame("Header", 0, 0, 8);
  header.primaryAxisAlignItems = "SPACE_BETWEEN";
  header.counterAxisAlignItems = "CENTER";
  setFill(header, "fill");

  const headerLeft = vFrame("header-left", "auto", 2, 0, 0);
  headerLeft.appendChild(txt("Activity", 24, "Black", "#f9fafb"));
  headerLeft.appendChild(txt("Sunday, March 22", 11, "Regular", "#6b7280"));

  const addBtn = hFrame("add-btn", 6, 12, 8);
  addBtn.fills = solidFill("#1f1f1f");
  addBtn.strokes = stroke("#3a3a3a");
  addBtn.strokeWeight = 1;
  addBtn.cornerRadius = 10;
  addBtn.counterAxisAlignItems = "CENTER";
  addBtn.appendChild(txt("+ Add Preset", 12, "Semi Bold", "#f9fafb"));

  header.appendChild(headerLeft);
  header.appendChild(addBtn);
  main.appendChild(header);

  // ─── 2. METRIC RINGS ────────────────────────────────────────────────────────

  const ringsRow = hFrame("Metric Rings", 12);
  ringsRow.primaryAxisSizingMode = "FIXED";
  ringsRow.counterAxisSizingMode = "AUTO";
  ringsRow.resize(358, 10);
  ringsRow.primaryAxisAlignItems = "SPACE_BETWEEN";

  const r1 = metricRing("Sessions", 3, "/ wk", "this week", "#ef4444", 3 / 5);
  const r2 = metricRing("Streak", 7, "days", "current",   "#f97316", 7 / 30);
  const r3 = metricRing("Last 7d", 5, "done", "workouts",  "#22c55e", 5 / 7);

  r1.layoutGrow = 1; r1.layoutAlign = "STRETCH";
  r2.layoutGrow = 1; r2.layoutAlign = "STRETCH";
  r3.layoutGrow = 1; r3.layoutAlign = "STRETCH";

  ringsRow.appendChild(r1);
  ringsRow.appendChild(r2);
  ringsRow.appendChild(r3);
  main.appendChild(ringsRow);

  // ─── 3. TODAY'S SESSION CARD ────────────────────────────────────────────────

  const todayCard = hFrame("Today's Session", 12, 16, 14);
  todayCard.fills = solidFill("#161616");
  todayCard.strokes = stroke("#2a2a2a", 1);
  todayCard.strokeDashes = [4, 4];
  todayCard.strokeWeight = 1;
  todayCard.cornerRadius = 16;
  todayCard.counterAxisAlignItems = "CENTER";
  todayCard.primaryAxisAlignItems = "SPACE_BETWEEN";
  todayCard.layoutAlign = "STRETCH";
  todayCard.primaryAxisSizingMode = "FIXED";
  todayCard.resize(358, 10);
  todayCard.counterAxisSizingMode = "AUTO";

  const todayLeft = vFrame("today-left", "auto", 2, 0, 0);
  todayLeft.appendChild(txt("No workout planned today", 13, "Semi Bold", "#9ca3af"));
  todayLeft.appendChild(txt("Load a preset or rest up", 10, "Regular", "#6b7280"));

  const presetsLink = hFrame("presets-link", 4, 0, 0);
  presetsLink.counterAxisAlignItems = "CENTER";
  presetsLink.appendChild(txt("Presets", 11, "Semi Bold", "#ef4444"));

  todayCard.appendChild(todayLeft);
  todayCard.appendChild(presetsLink);
  main.appendChild(todayCard);

  // ─── 4. TAB BAR ─────────────────────────────────────────────────────────────

  const tabBar = hFrame("Tab Bar", 4, 4, 4);
  tabBar.fills = solidFill("#141414");
  tabBar.cornerRadius = 14;
  tabBar.layoutAlign = "STRETCH";
  tabBar.primaryAxisSizingMode = "FIXED";
  tabBar.resize(358, 10);
  tabBar.counterAxisSizingMode = "AUTO";
  tabBar.primaryAxisAlignItems = "SPACE_BETWEEN";

  const tabs = ["Presets", "Calendar", "Exercises", "Muscles"];
  tabs.forEach((name, i) => {
    const active = i === 0;
    const tab = hFrame("tab-" + name, 0, 10, 8);
    tab.fills = active ? solidFill("#1f1f1f") : noFill();
    tab.cornerRadius = 10;
    tab.counterAxisAlignItems = "CENTER";
    tab.layoutGrow = 1;
    tab.primaryAxisAlignItems = "CENTER";
    tab.appendChild(txt(name, 11, "Semi Bold", active ? "#f9fafb" : "#6b7280"));
    tabBar.appendChild(tab);
  });
  main.appendChild(tabBar);

  // ─── 5. PRESETS SECTION ─────────────────────────────────────────────────────

  const presetsSection = vFrame("Presets Section", "fill", 12, 0, 0);
  presetsSection.layoutAlign = "STRETCH";

  // 2-col grid
  const presetGrid = hFrame("preset-grid", 12);
  presetGrid.layoutAlign = "STRETCH";
  presetGrid.primaryAxisSizingMode = "FIXED";
  presetGrid.resize(358, 10);
  presetGrid.counterAxisSizingMode = "AUTO";
  presetGrid.primaryAxisAlignItems = "SPACE_BETWEEN";
  presetGrid.counterAxisAlignItems = "STRETCH";

  function presetCard(name, count, exercises) {
    const c = hFrame("preset-" + name, 8, 16, 14);
    c.fills = solidFill("#161616");
    c.strokes = stroke("#2a2a2a");
    c.strokeWeight = 1;
    c.cornerRadius = 16;
    c.counterAxisAlignItems = "CENTER";
    c.layoutGrow = 1;
    c.layoutAlign = "STRETCH";
    c.primaryAxisSizingMode = "FIXED";
    c.resize(167, 10);

    const info = vFrame("info", "auto", 3, 0, 0);
    info.layoutGrow = 1;
    const nameRow = hFrame("name-row", 6);
    nameRow.counterAxisAlignItems = "CENTER";
    nameRow.appendChild(txt(name, 13, "Bold", "#f9fafb"));
    nameRow.appendChild(pill(count + "x", "#2a2a2a", "#9ca3af", 6));
    info.appendChild(nameRow);
    info.appendChild(txt(exercises, 10, "Regular", "#6b7280"));

    const playBtn = figma.createFrame();
    playBtn.name = "play";
    playBtn.resize(36, 36);
    playBtn.cornerRadius = 10;
    playBtn.fills = solidFill("#3f0a0a");
    playBtn.appendChild((() => { const t = txt("▶", 12, "Regular", "#ef4444", "CENTER"); t.x = 12; t.y = 10; return t; })());

    c.appendChild(info);
    c.appendChild(playBtn);
    return c;
  }

  const p1 = presetCard("Push Day A", 6, "Bench · OHP · Incline · Dips...");
  const p2 = presetCard("Pull Day B", 5, "Deadlift · Rows · Pullups...");
  presetGrid.appendChild(p1);
  presetGrid.appendChild(p2);
  presetsSection.appendChild(presetGrid);

  // Community section
  presetsSection.appendChild(txt("FROM THE COMMUNITY", 9, "Semi Bold", "#4b5563"));

  const communityGrid = hFrame("community-grid", 12);
  communityGrid.layoutAlign = "STRETCH";
  communityGrid.primaryAxisSizingMode = "FIXED";
  communityGrid.resize(358, 10);
  communityGrid.counterAxisSizingMode = "AUTO";

  function socialCard(initials, user, name, tags) {
    const c = vFrame("social-" + name, 167, 8, 16, 14);
    c.fills = solidFill("#161616");
    c.strokes = stroke("#2a2a2a");
    c.strokeWeight = 1;
    c.cornerRadius = 16;
    c.layoutGrow = 1;

    const topRow = hFrame("top", 10);
    topRow.counterAxisAlignItems = "CENTER";

    const avatar = figma.createEllipse();
    avatar.name = "avatar";
    avatar.resize(36, 36);
    avatar.fills = solidFill("#1f1f1f");
    avatar.strokes = stroke("#3a3a3a");
    avatar.strokeWeight = 1;

    const iniText = txt(initials, 11, "Bold", "#ef4444", "CENTER");
    iniText.x = 9; iniText.y = 10;

    const avatarFrame = figma.createFrame();
    avatarFrame.name = "avatar-frame";
    avatarFrame.resize(36, 36);
    avatarFrame.fills = noFill();
    avatarFrame.clipsContent = false;
    avatarFrame.appendChild(avatar);
    avatarFrame.appendChild(iniText);

    const nameBlock = vFrame("name-block", "auto", 2, 0, 0);
    nameBlock.appendChild(txt(name, 13, "Bold", "#f9fafb"));
    nameBlock.appendChild(txt("by " + user, 10, "Regular", "#6b7280"));

    topRow.appendChild(avatarFrame);
    topRow.appendChild(nameBlock);

    const tagRow = hFrame("tags", 4);
    tags.forEach(t => tagRow.appendChild(pill(t, "#1f1f1f", "#9ca3af", 6)));

    c.appendChild(topRow);
    c.appendChild(tagRow);
    return c;
  }

  const s1 = socialCard("DG", "David G.", "Arnold Split A", ["Hypertrophy", "90 min"]);
  const s2 = socialCard("SC", "Sarah C.", "Terminator Legs", ["Strength", "60 min"]);
  communityGrid.appendChild(s1);
  communityGrid.appendChild(s2);
  presetsSection.appendChild(communityGrid);
  main.appendChild(presetsSection);

  // ─── 6. CALENDAR SECTION ────────────────────────────────────────────────────

  const calLabel = txt("─── CALENDAR TAB ───", 9, "Semi Bold", "#374151");
  main.appendChild(calLabel);

  const calSection = hFrame("Calendar Section", 12);
  calSection.layoutAlign = "STRETCH";
  calSection.primaryAxisSizingMode = "FIXED";
  calSection.resize(358, 10);
  calSection.counterAxisSizingMode = "AUTO";
  calSection.counterAxisAlignItems = "STRETCH";

  // Calendar grid card
  const calCard = vFrame("calendar-card", 167, 8, 16, 16);
  calCard.fills = solidFill("#161616");
  calCard.strokes = stroke("#2a2a2a");
  calCard.strokeWeight = 1;
  calCard.cornerRadius = 16;
  calCard.layoutGrow = 1;

  calCard.appendChild(txt("March 2026", 13, "Semi Bold", "#f9fafb"));

  // Day labels
  const dayLabels = hFrame("day-labels", 0);
  dayLabels.primaryAxisSizingMode = "FIXED";
  dayLabels.resize(135, 10);
  dayLabels.primaryAxisAlignItems = "SPACE_BETWEEN";
  ["Mo","Tu","We","Th","Fr","Sa","Su"].forEach(d => {
    dayLabels.appendChild(txt(d, 9, "Semi Bold", "#4b5563", "CENTER"));
  });
  calCard.appendChild(dayLabels);

  // Calendar rows (5 weeks)
  const weeks = [
    ["","","","","","1","2"],
    ["3","4","5","6","7","8","9"],
    ["10","11","12","13","14","15","16"],
    ["17","18","19","20","21","22","23"],
    ["24","25","26","27","28","29","30"],
  ];
  weeks.forEach(week => {
    const row = hFrame("week", 0);
    row.primaryAxisSizingMode = "FIXED";
    row.resize(135, 10);
    row.primaryAxisAlignItems = "SPACE_BETWEEN";
    row.counterAxisAlignItems = "CENTER";
    week.forEach(d => {
      const isToday = d === "22";
      const hasWorkout = ["8","15","17","20"].includes(d);
      const cell = figma.createFrame();
      cell.name = "day-" + d;
      cell.resize(17, 17);
      cell.cornerRadius = 8;
      cell.fills = isToday ? solidFill("#ef4444") : noFill();
      const dt = txt(d, 9, isToday ? "Bold" : "Regular",
        isToday ? "#ffffff" : hasWorkout ? "#ef4444" : "#9ca3af", "CENTER");
      dt.x = d.length === 2 ? 1 : 4;
      dt.y = 3;
      cell.appendChild(dt);
      row.appendChild(cell);
    });
    calCard.appendChild(row);
  });

  // History side
  const histCard = vFrame("history", 167, 8, 16, 16);
  histCard.fills = solidFill("#161616");
  histCard.strokes = stroke("#2a2a2a");
  histCard.strokeWeight = 1;
  histCard.cornerRadius = 16;
  histCard.layoutGrow = 1;

  histCard.appendChild(txt("MARCH 22, 2026", 9, "Semi Bold", "#4b5563"));

  const noWorkout = vFrame("no-workout", "auto", 6, 0, 32);
  noWorkout.layoutAlign = "STRETCH";
  noWorkout.counterAxisAlignItems = "CENTER";
  noWorkout.appendChild(txt("No workouts\non this day", 12, "Regular", "#4b5563", "CENTER"));
  histCard.appendChild(noWorkout);

  calSection.appendChild(calCard);
  calSection.appendChild(histCard);
  main.appendChild(calSection);

  // ─── 7. EXERCISES SECTION ───────────────────────────────────────────────────

  main.appendChild(txt("─── EXERCISES TAB ───", 9, "Semi Bold", "#374151"));

  const exSection = hFrame("Exercises Section", 12);
  exSection.layoutAlign = "STRETCH";
  exSection.primaryAxisSizingMode = "FIXED";
  exSection.resize(358, 10);
  exSection.counterAxisSizingMode = "AUTO";
  exSection.counterAxisAlignItems = "STRETCH";

  // Left: exercise list
  const exList = vFrame("exercise-list", 140, 0, 0, 0);
  exList.fills = solidFill("#161616");
  exList.strokes = stroke("#2a2a2a");
  exList.strokeWeight = 1;
  exList.cornerRadius = 16;
  exList.clipsContent = true;

  const exHeader = hFrame("ex-header", 0, 16, 10);
  exHeader.fills = solidFill("#111111");
  exHeader.layoutAlign = "STRETCH";
  exHeader.appendChild(txt("EXERCISE LIBRARY", 9, "Semi Bold", "#4b5563"));
  exList.appendChild(exHeader);

  const exercises = ["Bench Press","Squat","Deadlift","Overhead Press","Barbell Row","Pull-Up","Dip","Leg Press"];
  exercises.forEach((name, i) => {
    const row = hFrame("ex-" + name, 0, 16, 10);
    row.fills = i === 0 ? solidFill("#ef4444") : noFill();
    row.cornerRadius = 10;
    row.layoutAlign = "STRETCH";
    row.appendChild(txt(name, 12, i === 0 ? "Semi Bold" : "Regular", i === 0 ? "#ffffff" : "#9ca3af"));
    exList.appendChild(row);
  });

  // Right: exercise detail
  const exDetail = vFrame("exercise-detail", 206, 12, 0, 0);
  exDetail.fills = solidFill("#161616");
  exDetail.strokes = stroke("#2a2a2a");
  exDetail.strokeWeight = 1;
  exDetail.cornerRadius = 16;
  exDetail.clipsContent = true;

  // Image placeholder
  const imgPlaceholder = figma.createFrame();
  imgPlaceholder.name = "exercise-image";
  imgPlaceholder.resize(206, 120);
  imgPlaceholder.fills = solidFill("#1f1f1f");
  const imgLabel = txt("Exercise Image", 11, "Regular", "#374151", "CENTER");
  imgLabel.x = 60; imgLabel.y = 52;
  imgPlaceholder.appendChild(imgLabel);

  const detailBody = vFrame("detail-body", "fill", 12, 16, 16);
  detailBody.layoutAlign = "STRETCH";
  detailBody.appendChild(txt("Bench Press", 18, "Black", "#f9fafb"));

  const badgeRow = hFrame("badges", 6);
  badgeRow.appendChild(pill("Chest", "#1f1f1f", "#9ca3af", 8));
  badgeRow.appendChild(pill("Compound", "#1f1f1f", "#6b7280", 8));
  detailBody.appendChild(badgeRow);

  detailBody.appendChild(txt("HOW TO", 9, "Semi Bold", "#4b5563"));
  const steps = ["Lie flat on bench, grip slightly wider than shoulder-width.","Lower bar to mid-chest with control.","Press explosively back to start."];
  steps.forEach((s, i) => {
    const stepRow = hFrame("step-" + i, 8);
    stepRow.counterAxisAlignItems = "MIN";
    stepRow.appendChild(txt((i + 1) + ".", 10, "Bold", "#ef4444"));
    stepRow.appendChild(txt(s, 10, "Regular", "#9ca3af"));
    detailBody.appendChild(stepRow);
  });

  detailBody.appendChild(txt("MAX WEIGHT OVER TIME · KG", 9, "Semi Bold", "#4b5563"));

  // Chart placeholder
  const chartFrame = figma.createFrame();
  chartFrame.name = "progress-chart";
  chartFrame.resize(174, 100);
  chartFrame.fills = solidFill("#111111");
  chartFrame.cornerRadius = 8;

  // Simple line chart made of rectangles as bars
  const chartData = [60, 65, 62, 70, 75, 72, 80, 85];
  const barW = 14;
  chartData.forEach((val, i) => {
    const barH = Math.round((val / 100) * 80);
    const bar = figma.createRectangle();
    bar.resize(barW, barH);
    bar.x = 8 + i * 20;
    bar.y = 100 - barH - 10;
    bar.fills = solidFill("#ef4444");
    bar.opacity = 0.4 + (i / chartData.length) * 0.6;
    bar.cornerRadius = 3;
    chartFrame.appendChild(bar);

    const label = txt(String(val), 7, "Regular", "#4b5563", "CENTER");
    label.x = 8 + i * 20;
    label.y = 88;
    chartFrame.appendChild(label);
  });

  detailBody.appendChild(chartFrame);
  exDetail.appendChild(imgPlaceholder);
  exDetail.appendChild(detailBody);

  exSection.appendChild(exList);
  exSection.appendChild(exDetail);
  main.appendChild(exSection);

  // ─── 8. MUSCLES SECTION ─────────────────────────────────────────────────────

  main.appendChild(txt("─── MUSCLES TAB ───", 9, "Semi Bold", "#374151"));

  const muscSection = hFrame("Muscles Section", 12);
  muscSection.layoutAlign = "STRETCH";
  muscSection.primaryAxisSizingMode = "FIXED";
  muscSection.resize(358, 10);
  muscSection.counterAxisSizingMode = "AUTO";
  muscSection.counterAxisAlignItems = "STRETCH";

  // Body map placeholder
  const bodyMap = vFrame("body-map", 140, 8, 12, 16);
  bodyMap.fills = solidFill("#161616");
  bodyMap.strokes = stroke("#2a2a2a");
  bodyMap.strokeWeight = 1;
  bodyMap.cornerRadius = 16;
  bodyMap.counterAxisAlignItems = "CENTER";

  // Simple body silhouette using shapes
  const silhouette = figma.createFrame();
  silhouette.name = "body-silhouette";
  silhouette.resize(80, 180);
  silhouette.fills = noFill();
  silhouette.clipsContent = false;

  // Head
  const head = figma.createEllipse();
  head.resize(28, 28);
  head.x = 26; head.y = 0;
  head.fills = solidFill("#2a2a2a");

  // Torso
  const torso = figma.createRectangle();
  torso.resize(46, 60);
  torso.x = 17; torso.y = 34;
  torso.fills = solidFill("#2a2a2a");
  torso.cornerRadius = 4;

  // Chest highlight
  const chest = figma.createRectangle();
  chest.resize(42, 24);
  chest.x = 19; chest.y = 36;
  chest.fills = solidFill("#ef4444");
  chest.opacity = 0.4;
  chest.cornerRadius = 4;

  // Arms
  const leftArm = figma.createRectangle();
  leftArm.resize(14, 50);
  leftArm.x = 0; leftArm.y = 36;
  leftArm.fills = solidFill("#2a2a2a");
  leftArm.cornerRadius = 4;

  const rightArm = figma.createRectangle();
  rightArm.resize(14, 50);
  rightArm.x = 66; rightArm.y = 36;
  rightArm.fills = solidFill("#2a2a2a");
  rightArm.cornerRadius = 4;

  // Legs
  const leftLeg = figma.createRectangle();
  leftLeg.resize(20, 80);
  leftLeg.x = 17; leftLeg.y = 96;
  leftLeg.fills = solidFill("#2a2a2a");
  leftLeg.cornerRadius = 4;

  const rightLeg = figma.createRectangle();
  rightLeg.resize(20, 80);
  rightLeg.x = 43; rightLeg.y = 96;
  rightLeg.fills = solidFill("#2a2a2a");
  rightLeg.cornerRadius = 4;

  [head, torso, chest, leftArm, rightArm, leftLeg, rightLeg].forEach(n => silhouette.appendChild(n));

  bodyMap.appendChild(silhouette);
  bodyMap.appendChild(txt("Tap a muscle to\nview stats", 9, "Regular", "#4b5563", "CENTER"));

  // Muscle detail panel
  const muscDetail = vFrame("muscle-detail", 206, 12, 16, 16);
  muscDetail.fills = solidFill("#161616");
  muscDetail.strokes = stroke("#2a2a2a");
  muscDetail.strokeWeight = 1;
  muscDetail.cornerRadius = 16;
  muscDetail.layoutGrow = 1;

  const muscTitle = vFrame("musc-title", "auto", 2, 0, 0);
  muscTitle.appendChild(txt("Chest", 22, "Black", "#f9fafb"));
  muscTitle.appendChild(txt("MUSCLE GROUP", 9, "Semi Bold", "#4b5563"));
  muscDetail.appendChild(muscTitle);

  // Recovery ring + stats
  const muscRow = hFrame("musc-row", 12);
  muscRow.counterAxisAlignItems = "STRETCH";

  const recoveryRing = metricRing("Recovery", 72, "%", null, "#22c55e", 0.72);
  muscRow.appendChild(recoveryRing);

  const statsCol = vFrame("stats", "auto", 8, 0, 0);
  statsCol.layoutGrow = 1;

  const volCard = vFrame("volume", "fill", 4, 12, 10);
  volCard.fills = solidFill("#111111");
  volCard.cornerRadius = 10;
  volCard.layoutAlign = "STRETCH";
  volCard.appendChild(txt("VOLUME ACCUMULATED", 8, "Semi Bold", "#4b5563"));
  volCard.appendChild(txt("2,840 kg", 16, "Bold", "#f9fafb"));

  const lastCard = vFrame("last-trained", "fill", 4, 12, 10);
  lastCard.fills = solidFill("#111111");
  lastCard.cornerRadius = 10;
  lastCard.layoutAlign = "STRETCH";
  lastCard.appendChild(txt("LAST TRAINED", 8, "Semi Bold", "#4b5563"));
  lastCard.appendChild(txt("Mar 20", 16, "Bold", "#f9fafb"));

  statsCol.appendChild(volCard);
  statsCol.appendChild(lastCard);
  muscRow.appendChild(statsCol);
  muscDetail.appendChild(muscRow);
  muscSection.appendChild(bodyMap);
  muscSection.appendChild(muscDetail);
  main.appendChild(muscSection);

  // ─── FINALIZE ───────────────────────────────────────────────────────────────

  page.appendChild(main);
  figma.viewport.scrollAndZoomIntoView([main]);
  figma.closePlugin("✓ Activity page created — all sections top to bottom");
}

main().catch(err => figma.closePlugin("Error: " + err.message));
