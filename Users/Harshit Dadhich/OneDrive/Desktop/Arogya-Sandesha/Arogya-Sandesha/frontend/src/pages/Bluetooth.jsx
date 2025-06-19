import React, { useState } from 'react';

const Bluetooth = () => {
  const [log, setLog] = useState("");
  const [device, setDevice] = useState(null);

  const connectBluetooth = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['00001101-0000-1000-8000-00805f9b34fb'] // SPP UUID
      });
      setDevice(device);
      const server = await device.gatt.connect();
      console.log("Connected to Bluetooth device:", device.name);
      setLog(prev => prev + `Connected to ${device.name}\n`);

      // Your logic for service & characteristic reading goes here

    } catch (error) {
      console.error("Bluetooth error:", error);
      setLog(prev => prev + `Error: ${error.message}\n`);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Bluetooth Serial Monitor</h2>
      <button onClick={connectBluetooth}>Connect to Arduino</button>
      <pre style={{
        backgroundColor: '#000',
        color: '#0f0',
        padding: '1rem',
        marginTop: '1rem',
        height: '300px',
        overflow: 'auto'
      }}>
        {log}
      </pre>
    </div>
  );
};

export default Bluetooth;
