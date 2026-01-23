import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/userService";
import LogoutButton from "../components/LogoutButton";

function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCurrentUser()
            .then((data) => {
                setUser(data);
                setLoading(false);
            })
            .catch((error) => {
                console.log("STATUS:", error.response?.status);
                console.log("DATA:", error.response?.data);
                console.log("HEADERS:", error.response?.headers);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <p>Loading profile...</p>;
    }

    return (
        <div>
            <h1>Dashboard</h1>

            {user ? (
                <div>
                    <h3>User Profile</h3>
                    <p><b>Name:</b> {user.first_name} {user.last_name}</p>
                    <p><b>Username:</b> {user.username}</p>
                    <p><b>Email:</b> {user.email}</p>
                    <p><b>Phone:</b> {user.phone_no}</p>
                    <p><b>Gender:</b> {user.gender}</p>
                </div>
            ) : (
                <p>User data not available</p>
            )}

            <br />
            <LogoutButton />
        </div>
    );
}

export default Dashboard;
