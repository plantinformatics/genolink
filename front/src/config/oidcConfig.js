const oidcConfig = {
    authority: import.meta.env.VITE_Genesys_OIDC_AUTHORITY,
    client_id: import.meta.env.VITE_Genesys_OIDC_CLIENT_ID,
    client_secret: import.meta.env.VITE_Genesys_OIDC_CLIENT_SECRET,
    redirect_uri: import.meta.env.VITE_Genesys_OIDC_REDIRECT_URI,
  };
  
  export default oidcConfig;
