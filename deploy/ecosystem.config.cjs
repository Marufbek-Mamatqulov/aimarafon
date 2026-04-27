module.exports = {
  apps: [
    {
      name: "aimarafon-app",
      cwd: "/var/www/aimarafon",
      script: "npm",
      args: "run start -- -p 4000",
      env: {
        NODE_ENV: "production",
        PORT: "4000",
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      error_file: "/var/log/aimarafon/error.log",
      out_file: "/var/log/aimarafon/out.log",
      time: true,
      autorestart: true,
    },
  ],
};
