// garbage collec- .. sorry, I meant image tiles collator. 

/*
function collate(uuid){


  let image = a;


  return image
}
*/
let BASE64_MARKER = ';base64,';

function base64ToRGB(dataURI) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('loadend', (e) => {
      const text = e.srcElement.result;

      let raw = window.atob(text);
      //console.log(raw);
      console.log("we should see this before drawCanvas")
      let rawLength = raw.length;
      let array = new Uint8Array(new ArrayBuffer(rawLength));
      console.log("rawlength: " + rawLength)
      for(i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      console.log("base64ToRGB returns:")
      console.log(array)
      resolve(array);
    });

    reader.readAsText(dataURI)
  });
}

function drawCanvas(canvas, data, top_left, width, height) {

  let img = new Image();
  img.onload = function(){
    context.drawImage(this, 0, 0, canvas.width, canvas.height)
  }
  let debug = [];
  let context = canvas.getContext('2d');
  for(let x = top_left[0]; x < canvas.width; ++x){
    for(let y = top_left[1]; y < canvas.height; ++y){
      let r_index = x * canvas.height * 3 + y * 3;
      //debug.push(r_index)
      let r = data[r_index];
      let g = data[r_index+1];
      let b = data[r_index+2];
      context.fillStyle = `rgb(${r}, ${g}, ${b})`;
      //console.log(`rgb(${r}, ${g}, ${b})`)
      context.fillRect(x,y,1,1);

      debug.push(r);
      debug.push(g);
      debug.push(b);
    }
    //console.log("Progress: " + y/canvas.height)
  }
  console.log(debug)

  let converted_base64 = canvas.toDataURL("image/png");
  console.log(converted_base64);
  img.src = converted_base64;

  console.log("Draw complete!")
}

/*
function parseMetadata(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('loadend', (e) => {
      const text = e.srcElement.result;
      const jsonMeta = JSON.parse(text)
      console.log(jsonMeta)
      resolve(jsonMeta);
    });

    reader.readAsText(file)
  });
}
*/


function launch(uuid, aws, total_height, total_width) {
  const metadata = aws + uuid + "-metadata";
  console.log("Fetching from: " + metadata)
  fetch(metadata, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })
    .then(res => res.json())
    .then(metadata => {
      // At this point, metadata is an array of metadata JSON objects.
      // We now need to go through each of them and fetch their blobs.
      let tiedPromises = metadata.map(entry => {
        let blobPromise = fetch(aws + entry.key);
        return new Promise((resolve, reject) => {
          blobPromise.then(blob => {
            resolve({entry: entry, blob: blob});
          });
        })
          .catch(err => reject(err));
      });
      return Promise.all(tiedPromises);
    })
    .then(blobAndEntries => {
      canvas.height = total_height;
      canvas.width = total_width;
      document.body.appendChild(canvas);
      console.log(blobsAndEntries);
      for (let blobAndEntry in blobsAndEntries) {
        base64ToRGB(blobAndEntry.blob).then(rgbarray => {
          drawCanvas(rgbarray, blob.entry.top_left, blob.entry.width, blob.entry.height);
        });
      }
    })
    .catch(e => console.log(e));
}
