import { useEffect, useState } from "react";
import { getAudits } from "../services/auditService";

function Audits() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAudits()
      .then(setAudits)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading audits...</p>;

  return (
    <div>
      <h2>Audit Trail</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Action</th>
            <th>User</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {audits.map((audit) => (
            <tr key={audit.id}>
              <td>{audit.id}</td>
              <td>{audit.action}</td>
              <td>{audit.user_email}</td>
              <td>{audit.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Audits;
