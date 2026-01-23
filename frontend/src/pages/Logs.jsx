import { useEffect, useState } from "react";
import { getLogs } from "../services/logService";

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading logs...</p>;

  return (
    <div>
      <h2>Logs</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>File Name</th>
            <th>Level</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{log.file_name}</td>
              <td>{log.level}</td>
              <td>{log.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Logs;
