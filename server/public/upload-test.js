document.getElementById('uploadBtn').addEventListener('click', async () => {
  const token = document.getElementById('token').value.trim();
  const resourceId = document.getElementById('resourceId').value.trim();
  const fileInput = document.getElementById('photo');
  const resultBox = document.getElementById('result');

  if (!token || !resourceId || !fileInput.files[0]) {
    resultBox.textContent = 'Please fill in token, resource ID, and choose a file.';
    return;
  }

  const formData = new FormData();
  formData.append('photo', fileInput.files[0]);

  resultBox.textContent = 'Uploading...';

  try {
    const res = await fetch(`/api/upload/resource/${resourceId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    resultBox.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    resultBox.textContent = 'Error: ' + err.message;
  }
});