/*
====================================
Juniper config to set converter
https://github.com/Mr-Method/jun2set
====================================
date: 2023.08.13
====================================
*/

const btnConvert = document.querySelector('[data-convert]');
const btnClean = document.querySelector('[data-clear]');
const outputBlock = document.querySelector('.output');
const codeBlock = document.getElementById('textout');
let setInstance = "";

btnConvert.addEventListener('click', doConvert);
btnClean.addEventListener('click', destroyBoxes);
const dptree = {};

function SetDPTree(commands, mode, leaf) {
  let str = commands.join(' ');
  if ( dptree[mode] === undefined ) dptree[mode] = {};
  if ( dptree[mode][str] === undefined ) dptree[mode][str] = leaf;
}

function GetDPTree(commands, mode) {
  let str = commands.join(' ');
  if ( dptree[mode] === undefined || dptree[mode][str] === undefined ) return;
  setInstance += dptree[mode][str];
  delete dptree[mode][str];
}

function FiltrInactive(leaf) {
  let str = leaf.slice();
  console.log(str);
  str = str.replace(/\s(\d+)\s*$/, ``);
  str = str.replace(/(\sdiscard.*)$/, ``);
  str = str.replace(/(policer)\s.+$/, `$1`);
  str = str.replace(/(\snext-hop\s.*)$/, ``);
  str = str.replace(/(keepalives)\s.+$/, `$1`);
  str = str.replace(/(\smembers\s\d+\:\d+)\s*$/, ``);

  console.log(str);
  return str;
}

function printSetCommand(commands, leaf) {
  console.log(`${commands.join(' ')} ${leaf}`);
}

function retSetCommand(commands, leaf) {
  let str = `${commands.join(' ')} ${leaf}`;
  str.replace(/\s{2,}/g, `\ `);
  return str + "\n";
}

function replaceCurly(s) {
  return s.replace('{', '{\n').replace('}', '\n}');
}

function doConvert() {
  setInstance = "";
  let data = document.getElementById("textin").value;
  let filein;
  let ignoreAnnotations = 0;

  if (!data.includes('"')) {
    data = replaceCurly(data);
  } else {
    data = data
      .split('"')
      .map((item, i) => (i % 2 !== 0 ? replaceCurly(item) : item))
      .join('"');
  }

  const lAnnotations = [];
  let annotation = '';
  const tree = ['set'];

  const lines = data.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '' || line.startsWith('#')) {
      continue;
    }

    if (line.startsWith('/*')) {
      annotation = line.replace('/* ', '"').replace(' */', '"');
    } else {
      let cleanElem = line.trim().replace(/[\t\r]/g, '');

      if (annotation) {
        lAnnotations.push('top');
        if (tree.length > 1) {
          const level = [...tree];
          level[0] = 'edit';
          lAnnotations.push(level.join(' '));
        }
        const cleanElemOrig = cleanElem;
        if (cleanElem.includes(';')) {
          cleanElem = cleanElem.split(' ')[0];
        }
        lAnnotations.push(`annotate ${cleanElemOrig} ${annotation}`);
        annotation = '';
      }

      if (cleanElem.includes(";")) {
        if ( cleanElem.match(/\[(.*?)\];/g) ) {
          var [a, b] = cleanElem.split(' [ ');
          if (a.includes('inactive: ')) {
            a = a.replace('inactive: ', '');
            const linactive = [...tree];
            linactive[0] = 'deactivate';
            SetDPTree(tree, 'inactive_array', retSetCommand(linactive, a));
          } else if (a.includes('protect: ')) {
            a = a.replace('protect: ', '');
            const lprotect = [...tree];
            lprotect[0] = 'protect';
            SetDPTree(tree, 'protect_line', retSetCommand(lprotect, a));
          }
          b.split(' ').forEach(function (item) {
            if (!item.includes(']')) {
              setInstance += retSetCommand(tree, a+' '+item);
            } else {
              GetDPTree(tree, 'inactive_array');
              GetDPTree(tree, 'protect_array');
            }
          });
          // alert(retSetCommand(tree, cleanElem.split(';')[0]));
        } else {
          if (cleanElem.includes('inactive: ')) {
            cleanElem = cleanElem.replace('inactive: ', '');
            const linactive = [...tree];
            linactive[0] = 'deactivate';
            SetDPTree(tree, 'inactive_line', retSetCommand(linactive, FiltrInactive(cleanElem.replace(/\;\s*.*/, '')))); //.split(' ')[0]
          } else if (cleanElem.includes('protect: ')) {
            cleanElem = cleanElem.replace('protect: ', '');
            const lprotect = [...tree];
            lprotect[0] = 'protect';
            SetDPTree(tree, 'protect_line', retSetCommand(lprotect, cleanElem.replace(/\;\s*.*/, '')));
          }
          setInstance += retSetCommand(tree, cleanElem.replace(/\;\s*.*/, ''));
        }
        GetDPTree(tree, 'inactive_line');
        GetDPTree(tree, 'protect_line');
      } else if (cleanElem === '}') {
        GetDPTree(tree, 'inactive_block');
        GetDPTree(tree, 'protect_block');
        tree.pop();
      } else {
        cleanElem = cleanElem.replace(' {', '');
        if (cleanElem.includes('inactive: ')) {
          cleanElem = cleanElem.replace('inactive: ', '');
          const linactive = [...tree];
          linactive[0] = 'deactivate';
          tree.push(cleanElem);
          SetDPTree(tree, 'inactive_block', retSetCommand(linactive, cleanElem));
        } else if (cleanElem.includes('protect: ')) {
          cleanElem = cleanElem.replace('protect: ', '');
          const lprotect = [...tree];
          lprotect[0] = 'protect';
          tree.push(cleanElem);
          SetDPTree(tree, 'protect_block', retSetCommand(lprotect, cleanElem));
        } else {
          tree.push(cleanElem);
        }
      }
    }
  }

  if (!ignoreAnnotations) {
    for (const a of lAnnotations) {
      console.log(a);
    }
  }
  showSet();
}

function destroyBoxes() {
  setInstance = "";
  codeBlock.innerText = "";
  outputBlock.style.display = 'none';
}

function showSet() {
  codeBlock.innerText = setInstance;
  if ( setInstance ) {
    outputBlock.style.display = 'block';
  	var b = document.createElement("button");
	b.className = "at_copy";
	b.type = "button";
	b.ariaLabel = "Copy code to clipboard";
	b.innerText = "Copy";
	codeBlock.parentElement.append(b);
	b.addEventListener("click", function() {
		var e = codeBlock.innerText.trim();
        copyTextToClipboard(e);
        b.innerText = "Copied";
        setTimeout(function() {
			b.innerText = "Copy"
		}, 1e3)
    });
  }
}

function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }
  document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
     console.error('Async: Could not copy text: ', err);
  });
}