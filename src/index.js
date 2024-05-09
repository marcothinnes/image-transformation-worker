addEventListener("fetch", event => {
    event.respondWith(handleRequest(event.request))
  })
  
  /**
   * Fetch and log a request
   * @param {Request} request
   */
  async function handleRequest(request) {
    // Parse request URL to get access to query string
    let url = new URL(request.url)
  
    // Cloudflare-specific options are in the cf object.
    let options = { cf: { image: {} } }
  
    // Copy parameters from query string to request options.
    // You can implement various different parameters here.
    if (url.searchParams.has("fit")) options.cf.image.fit = url.searchParams.get("fit")
    if (url.searchParams.has("width")) options.cf.image.width = url.searchParams.get("width")
    if (url.searchParams.has("height")) options.cf.image.height = url.searchParams.get("height")
    if (url.searchParams.has("quality")) options.cf.image.quality = url.searchParams.get("quality")
  
    if (!url.searchParams.has("width")) {
      return new Response('Missing "width" param', { status: 400 })
    }
  
    // Your Worker is responsible for automatic format negotiation. Check the Accept header.
    const accept = request.headers.get("Accept");
    if (/image\/avif/.test(accept)) {
      options.cf.image.format = 'avif';
    } else if (/image\/webp/.test(accept)) {
      options.cf.image.format = 'webp';
    }
  
    // Get URL of the original (full size) image to resize.
    // You could adjust the URL here, e.g., prefix it with a fixed address of your server,
    // so that user-visible URLs are shorter and cleaner.
    
    // Fix for imageURL extraction
    if (!url.pathname.includes("/images/")) {
      return new Response('Missing "image" value', { status: 400 })
    }
    
    const BucketURL = 'https://bucket.not-a-single-bug.com'; 
    //const imageURL = `${BucketURL}/${url.href}`; 
  
    // Suchen der Position von '/images/' und Schneiden des Strings danach
    const imagesIndex = url.pathname.indexOf('/images/') + '/images/'.length;
    const imageURL = `${BucketURL}/${url.pathname.substring(imagesIndex)}`;
  
  
    
    try {
      // TODO: Customize validation logic
      const { hostname, pathname } = new URL(imageURL)
  
      // Optionally, only allow URLs with JPEG, PNG, GIF, or WebP file extensions
      // @see https://developers.cloudflare.com/images/url-format#supported-formats-and-limitations
      if (!/\.(jpe?g|png|gif|webp)$/i.test(pathname)) {
        return new Response('Disallowed file extension ' + pathname, { status: 400 })
      }
  
      // Demo: Only accept "example.com" images
      //if (hostname !== 'cf-mthinnes.work') {
      //  return new Response('Must use "cf-mthinnes.work" source images', { status: 403 })
      //}
    } catch (err) {
      return new Response('Invalid "image" value', { status: 400 })
    }
  
    // Build a request that passes through request headers
    const imageRequest = new Request(imageURL, {
      headers: request.headers
    })
  
    // Returning fetch() with resizing options will pass through response with the resized image.
    return fetch(imageRequest, options)
  }