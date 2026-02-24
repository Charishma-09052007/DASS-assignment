import { useState } from "react";
import axios from "axios";

function CreateEvent() {
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Normal");

  const handleCreate = async () => {
    const token = localStorage.getItem("token");
    await axios.post("http://localhost:5000/api/events/create",
      { eventName, eventType },
      { headers: { Authorization: token } }
    );
    alert("Event created!");
  };

  return (
    <div>
      <h2>Create Event</h2>
      <input placeholder="Event Name" onChange={e => setEventName(e.target.value)} />
      <select onChange={e => setEventType(e.target.value)}>
        <option value="Normal">Normal Event</option>
        <option value="Merchandise">Merchandise Event</option>
      </select>
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}

export default CreateEvent;
