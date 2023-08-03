<div align="center">

# [Oslyn Tabs](https://tabs.oslyn.io)

3 words: **Synchronized chord sheets**.

<img src="https://github.com/DominicFung/oslyn-studio-v3/blob/main/screenshots/Desktop%20-%20Controls%20Open%20-%202023-08-02.jpeg?raw=true" align="center"
     alt="Screenshot of Logistical.ly" width="830" height="504">
</p>

<img src="https://github.com/DominicFung/oslyn-studio-v3/blob/main/screenshots/Desktop%20-%20Dark%20Mode%20-%202023-08-02.jpeg?raw=true" align="center"
     alt="Screenshot of Logistical.ly" width="830" height="504">
</p>

</div>

## Why?

I love how music brings people together. Most chord sheet apps focus on the individual, but I wanted something different. This app lets people join jam sessions and sync their chord sheets. It doesn't matter if someone is not very familiar with a song; they can still participate. Music is all about connecting, and that's what I wanted to encourage with this app.

## Web App: [tabs.oslyn.io](https://tabs.oslyn.io)

<img src="https://github.com/DominicFung/oslyn-studio-v3/blob/main/screenshots/iPhone%20SE%202023-08-02.jpeg?raw=true" align="center"
     alt="Screenshot of Logistical.ly" width="830" height="466">
</p>

**Features**:

 - Responsive, optimized for smaller screens (iPhone SE)
 - Page and key changes will update everyone in the session.
 - Capo, Text size, dark mode, etc. will only affect the current user.
 - "Heads Up" feature! Instrument players (those who're not tasked with turning the page) will be able to see the next line coming up.
 - Full Screen
 - QR Code to enter the jam session
 - Oauth Login (Facebook, Google) .. Apple help wanted!

## Getting started - Developers

I would really appreciate help :) 

### Setting Up an AWS account

1. Create an AWS account
2. Set up your AWS CLI
3. profile name should be `a1`

### Creating your OAUTH connections

1. Follow this for Facebook
2. Follow this for Google

### Creating your Replicate account (for image generation)

1. Login here: https://replicate.com/
2. Copy the access key

### deploying your backend

```
cd aws && npm i
npm run deploy
```

### Running the frontend

```
cd .. && npm i
npm run dev
```