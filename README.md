# l3lueGPT

A modern AI chat application built with React, TypeScript, and Supabase, featuring dual AI model support (Mistral and OpenAssistant).

## Features

- 🤖 Dual AI model support (Mistral and OpenAssistant)
- 🔒 Secure authentication with Supabase
- 💬 Real-time chat interface
- 🌐 Multilingual support (English and Chinese)
- 🎨 Beautiful UI with Tailwind CSS
- 📱 Responsive design
- ⚡ Powered by Vite

## Prerequisites

Before you begin, ensure you have the following:

- Node.js 18+ installed
- Supabase account
- Mistral API key (from [console.mistral.ai](https://console.mistral.ai))
- OpenAssistant API key (from [huggingface.co](https://huggingface.co/settings/tokens))

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/l3luegpt.git
   cd l3luegpt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment Guide

### Option 1: Deploy on a VPS (e.g., DigitalOcean, Linode)

1. SSH into your VPS:
   ```bash
   ssh user@your-server-ip
   ```

2. Install Node.js and npm:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. Install PM2 globally:
   ```bash
   sudo npm install -g pm2
   ```

4. Clone and setup the project:
   ```bash
   git clone https://github.com/yourusername/l3luegpt.git
   cd l3luegpt
   npm install
   ```

5. Create production environment file:
   ```bash
   nano .env
   ```
   Add your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

6. Build the project:
   ```bash
   npm run build
   ```

7. Start the server with PM2:
   ```bash
   pm2 start server/index.js --name l3luegpt
   pm2 save
   pm2 startup
   ```

8. Setup Nginx:
   ```bash
   sudo apt install nginx
   ```

   Create Nginx configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/l3luegpt
   ```

   Add the configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/l3luegpt /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. Setup SSL with Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option 2: Deploy on Platform-as-a-Service (e.g., Heroku)

1. Install the Heroku CLI and login:
   ```bash
   npm install -g heroku
   heroku login
   ```

2. Create a new Heroku app:
   ```bash
   heroku create l3luegpt
   ```

3. Set environment variables:
   ```bash
   heroku config:set VITE_SUPABASE_URL=your_supabase_url
   heroku config:set VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Deploy to Heroku:
   ```bash
   git push heroku main
   ```

## Database Setup

1. Create a new project in Supabase

2. Run the SQL migration in the Supabase SQL editor:
   - Copy the contents of \`supabase/migrations/20250110181756_turquoise_water.sql\`
   - Paste and execute in the SQL editor

3. Enable Email Auth in Supabase:
   - Go to Authentication → Providers
   - Enable Email provider
   - Configure password settings as needed

## Environment Variables

Required environment variables:

- \`VITE_SUPABASE_URL\`: Your Supabase project URL
- \`VITE_SUPABASE_ANON_KEY\`: Your Supabase project's anon/public key

## Contributing

1. Fork the repository
2. Create your feature branch: \`git checkout -b feature/amazing-feature\`
3. Commit your changes: \`git commit -m 'Add amazing feature'\`
4. Push to the branch: \`git push origin feature/amazing-feature\`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.