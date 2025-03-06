"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { supabase } from "@/app/lib/supabaseClient"; 
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchLogs = async () => {
      const { data: session } = await supabase.auth.getSession();
      console.log(session)
      if (!session?.session) {
        router.push("/login"); // Redirect if not logged in
        return;
      }

      try {
        const { data, error } = await supabase
          .from("log_stats")
          .select("*")
          .order("processed_at", { ascending: false });

        const newLogs = data && data.map(({file_id, file_path, error_count, keyword_counts, unique_ips}) => ({
          jobId: file_id,
          data: {
              filePath: file_path,
              errorCount: error_count,
              keywordCounts: keyword_counts,
              uniqueIPs: unique_ips
            }
        }))

        if (error) throw error;
        setLogs(newLogs || []);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };

    fetchLogs();

    const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    socket.onopen = () => console.log("✅ WebSocket connected!");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("websocket data-" + data)
      console.log("📩 WebSocket update:", data);
      setLogs((prevLogs) => {
        const existingLogIndex = prevLogs.findIndex((log) => log.jobId === data.jobId);
        if (existingLogIndex !== -1) {
          const updatedLogs = [...prevLogs];
          updatedLogs[existingLogIndex] = { ...updatedLogs[existingLogIndex], ...data };
          return updatedLogs;
        } else {
          return [{ ...data, jobId: data.jobId }, ...prevLogs];
        }
      });
    };
    socket.onclose = () => console.log("❌ WebSocket disconnected!");
    return () => socket.close();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("logFile", file);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token; // Get JWT Token
    
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload-logs`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`, // Attach JWT
          },
        }
      );

      if (response.status === 200) {
        console.log("📤 File uploaded! Waiting for processing...");
      }
    } catch (error) {
      console.error("❌ Upload failed:", error);
      router.push("/login"); 
    } finally {
      setUploading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login"; // Redirect to login page
  };

  return (
    <div className="p-6 space-y-4">
      <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded cursor-pointer">
          Logout
        </button>
      <Card>
        
        <CardContent className="p-4 space-y-2">
          <Input
            className="bg-blue-200 cursor-pointer"
            type="file"
            onChange={handleFileChange}
          />
          <Button
            className="cursor-pointer"
            onClick={uploadFile}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Log File"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">Processed Logs</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                {/* <th className="border p-2">Job id</th> */}
                <th className="border p-2">File Path</th>
                <th className="border p-2">Progress</th>
                <th className="border p-2">Errors</th>
                <th className="border p-2">Keywords</th>
                <th className="border p-2">Unique IPs</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 && logs.map((log, index) => (
                <tr key={index} className="border">
                  {/* <td className="border p-2">{log.jobId}</td> */}
                  <td className="border p-2">{log.data?.filePath}</td>
                  <td className="border p-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${log.progress ?? 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="border p-2">{log.data?.errorCount}</td>
                  <td className="border p-2">
                    {log.data && log.data?.keywordCounts
                      ? Object.entries(log.data?.keywordCounts)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(", ")
                      : "updating..."}
                  </td>
                  <td className="border p-2">{log.data?.uniqueIPs.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}