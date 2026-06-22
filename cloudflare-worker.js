export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Si la ruta inicia con /gastos, haz proxy a Heroku
    if (url.pathname.startsWith('/gastos')) {
      // Remove /gastos from the path
      const newPath = url.pathname.replace(/^\/gastos/, '') || '/';
      const herokuUrl = new URL(request.url);
      herokuUrl.host = 'enigmatic-chamber-84267-0a4a9aee38d5.herokuapp.com';
      herokuUrl.pathname = newPath;
      
      const newRequest = new Request(herokuUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      
      return fetch(newRequest);
    }
    
    // Si no es /gastos, retorna 404
    return new Response('Not Found', { status: 404 });
  },
};
