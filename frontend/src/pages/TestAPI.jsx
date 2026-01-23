import { useEffect } from "react";
import api from "../services/api";

function TestApi() {
  useEffect(() => {
    api.get("/docs")
      .then(() => console.log("Backend connected ✅"))
      .catch(() => console.log("Backend not reachable ❌"));
  }, []);

  return <h2>Testing Backend Connection</h2>;
}

export default TestApi;
