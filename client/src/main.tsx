import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
