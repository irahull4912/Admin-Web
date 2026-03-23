const formData = new FormData();
formData.append('image', new Blob(['test dummy image content']), 'test.png');
formData.append('linkUrl', 'https://example.com');
formData.append('altText', 'Test Banner');
formData.append('isActive', 'true');

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/banners', {
      method: 'POST',
      body: formData
    });
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE HEADERS", res.headers);
    console.log("RESPONSE BODY (first 1000 chars):", text.substring(0, 1000));
  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
}
test();
