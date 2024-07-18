import {useEffect, useState, useRef} from 'react'
import * as d3 from 'd3';

function getColors(category){
  switch (category){
    case "M/M": return "#0151d7" //blue
    case "F/M": return "#8a104e" //purple
    case "F/F": return "#d71234" //red
    case "Gen": return "#77a700" //green
    case "Multi": return "#fcdb03" //yellow
    case "N/A": return "#000000" //black
    case "Other": return "#c2c2c2" //grey
    default: return "???"
  }
}

function NetworkGraph() {
  const [DataCsv, setCsv] = useState([])
  const [pos, setpositions] = useState(null)
  const [seed, setseed] = useState(0)
  const [dis, setdis] = useState(0)
  const [scale, setscale] = useState(1000)
  const [nodes, setnodes] = useState([])
  const [links, setlinks] = useState([])
  const [option, setOptionChange] = useState('Spring')
  const lineRef = useRef()
  const circRef = useRef()
  const svgRef = useRef()

  //const margin = {top: 10, right: 30, bottom: 30, left: 40}
  const width = 1000
  const height = 750

  function ReadfileCsv(file){

    const reader = new FileReader();
    reader.onload = handleFileRead;
    reader.readAsText(file);

    function handleFileRead(event) {
      const csvString = event.target.result;
      const csvData = d3.csvParse(csvString, d3.autoType);

      const templin = []
      const tempnod = []

      csvData.forEach(row =>{
        var sourceNode = tempnod.find(node => {
            return node.Name === row.source;
        });

        // If source node doesn't exist, create it
        if (!sourceNode) {
            sourceNode = { Name: row.source, Nation: row.source_nation, Gender: row.source_gender};
            tempnod.push(sourceNode);
        }

        // Check if target node already exists
        var targetNode = tempnod.find(node => {
            return node.Name === row.target;
        });

        // If target node doesn't exist, create it
        if (!targetNode) {
            targetNode = { Name: row.target, Nation: row.target_nation, Gender: row.target_gender};
            tempnod.push(targetNode);
        }

        let type
        const slash = row.source_gender + '/' + row.target_gender

        if (slash === 'M/M' || slash === 'F/F' || slash === 'M/F' || slash === 'F/M' ) type = slash
        else if (slash.includes('V')) type = 'Other'
        else if (slash.includes('N')) type = 'N/A'
        else type = "???"

        templin.push({source: row.source, target: row.target, category: type, weight: row.weight})
      })

      console.log(tempnod)
      setlinks(templin)
      setnodes(tempnod)
      setCsv(csvData)
      setpositions(null)
    }
  }

  function downloadRandom(){
    fetch("http://100.24.30.27:8000/api/getRandomCsv", {
      method: 'GET',
    })
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(`There was an error: Couldn't get the csv`);
        }
        return response.json()
      })
      .then((data) => {
        const jsonobj = JSON.parse(data)
        //setCsv(jsonobj)
        const listOfDicts = [...jsonobj];

        const dictionaryKeys = Object.keys(listOfDicts[0]);

        const dictValuesAsCsv = listOfDicts.map(dict => (
          dictionaryKeys.map(key => dict[key]).join(',')
        ));

        const result = [dictionaryKeys.join(','), ...dictValuesAsCsv].join('\n');
        var download = function(data){ //download thing
          const blob = new Blob([data], { type: 'text/csv' });
    
          // Create a URL for the Blob
          const url = URL.createObjectURL(blob);
          
          // Create an anchor tag for downloading
          const a = document.createElement('a');
          
          // Set the URL and download attribute of the anchor tag
          a.href = url;
          a.download = "random.csv";
          
          // Trigger the download by clicking the anchor tag
          a.click();
        }
        download(result);
        })
        .catch((err) => console.error(`There was an error: ${err}`))

    // var download = function(href, name){ //download thing
    //   var link = document.createElement('a');
    //   link.download = name;
    //   link.style.opacity = "0";
    //   link.href = href;
    //   link.click();
    //   link.remove();
    // }
    // download(image, "image.png");
  }

  function fetchData(){
    //console.log('Getting')
    //console.log(seed, dis, scale)
    if (option === 'Spring'){
      fetch("http://100.24.30.27:8000/api/getNetwork", {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          {
            'data': DataCsv,
            'seed': seed, 
            'dis': dis,
            'scale': scale
          }
        ) //needs to be a json string :)
      })
        .then((response) => {
          if (response.status !== 200) {
            throw new Error(`There was an error: Csv is not the correct format`);
          }
          return response.json()
        })
        .then((data) => {
          const jsonobj = JSON.parse(data)
          const newpos = {}
          for (const key in jsonobj){ //make offset go to middle of screen (some are still outside tho)
            newpos[key] = {x: jsonobj[key].x + width/2, y:jsonobj[key].y + height/2}
          }
          setpositions(newpos)
          //console.log('finish')
        })
        .catch((err) => console.error(`There was an error: ${err}`))
    }
    else{ //kamada
      fetch("http://100.24.30.27:8000/api/getNetworkKamada", {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          {
            'data': DataCsv,
            'seed': seed, 
            'dis': dis,
            'scale': scale
          }
        ) //needs to be a json string :)
      })
        .then((response) => {
          if (response.status !== 200) {
            throw new Error(`Csv is not the correct format`);
          }
          return response.json()
        })
        .then((data) => {
          const jsonobj = JSON.parse(data)
          const newpos = {}
          for (const key in jsonobj){ //make offset go to middle of screen (some are still outside tho)
            newpos[key] = {x: jsonobj[key].x + width/2, y:jsonobj[key].y + height/2}
          }
          setpositions(newpos)
          //console.log('finish')
        })
        .catch((err) => console.error(`There was an error: ${err}`))
    }
  }

  useEffect(() => {
    if (DataCsv.length > 0) {
      setpositions(null)
      fetchData();
    }
  }, [DataCsv, option, seed, dis, scale])
  

  useEffect(()=>{
    if (pos == null) return

    console.log(nodes)
    //console.log(links)

    const bigW = Math.max(...links.map((link) => link.weight)) //largest weight

    //console.log('graphing')
    //console.log(pos)
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const lines = d3.select(lineRef.current)
    .selectAll("line")
    .data(links)
    .join(
      enter => enter.append("line")
        .style("stroke", d => getColors(d.category))
        .style("stroke-width", d => d.weight/bigW * 10)
        .attr("x1", d => pos[d.source].x)
        .attr("y1", d => pos[d.source].y)
        .attr("x2", d => pos[d.target].x)
        .attr("y2", d => pos[d.target].y),
      update => update
        .attr("x1", d => pos[d.source].x)
        .attr("y1", d => pos[d.source].y)
        .attr("x2", d => pos[d.target].x)
        .attr("y2", d => pos[d.target].y),
      exit => exit.remove()
    )
    
    const dots = d3.select(circRef.current)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join(
        enter => enter.append("circle")
          .attr("r", 10)
          .attr("cy", d => pos[d.Name].y)
          .attr("cx", d => pos[d.Name].x)
          .style("fill", d => color(d.Nation)),
        update => update
          .attr("cy", d => pos[d.Name].y)
          .attr("cx", d => pos[d.Name].x),
        exit => exit.remove()
      )

    dots.append("title")
      .text(d => d.Name);

    d3.select(svgRef.current).call(d3.zoom()
          .on("zoom", function(e){
            dots.attr("transform", e.transform)
            lines.attr("transform", e.transform)
          }));
  }, [height, width, nodes, links, pos])

  return (
    <div className="CsvViewer" style = {{display: 'flex'}}>
      <div>
        <p>Your Csv must be ordered by the following:</p>
        <table>
          <tbody>
            <tr>
              <th>source</th>
              <th>target</th>
              <th>weight</th>
              <th>source_gender</th>
              <th>target_gender</th>
              <th>source_nation</th>
              <th>target_nation</th>
            </tr>
            <tr>
              <td>Person_A</td>
              <td>Person_B</td>
              <td>45</td>
              <td>M</td>
              <td>F</td>
              <td>Sky</td>
              <td>Ocean</td>
            </tr>
            <tr>
              <td>Person_A</td>
              <td>Person_C</td>
              <td>100</td>
              <td>M</td>
              <td>M</td>
              <td>Sky</td>
              <td>Land</td>
            </tr>
          </tbody>
        </table>
        <div>
          <ul>
            <li>Source and Target are the nodes that has a link between them</li>
            <li>Weight is the amount of attraction they have between the source and target</li>
            <li>Gender and Nation is the respective node's attributes</li>
            <li>Scale will scale of the positions of the nodes</li>
            <li>Distance is the minimum distance allowed between nodes</li>
            <li>Seed is the set seed that will be used to determine positions</li>
            <li>Kamada-Kawai doesn't factor in seed or distance</li>
            <li>Hover over node to see Node name</li>
            <li>You can drag and zoom into the network graph</li>
          </ul>
        </div>
        <label>Choose Csv File:</label>
        <input type = 'file' accept=".csv" onChange={e => {
          if (e.target.files[0] === undefined) return //wanted to choose but canceled
          setCsv([])
          ReadfileCsv(e.target.files[0])
        }}/>
        <br/>
        <label>Scale:</label>
        <input type = 'number' defaultValue = {scale} onChange={e => isNaN(e.target.valueAsNumber) ? setscale(0) : setscale(e.target.valueAsNumber)}/>
        <label>Distance:</label>
        <input type = 'number' step=".01" defaultValue= {dis} onChange={e => isNaN(e.target.valueAsNumber) ? setdis(0) : setdis(e.target.valueAsNumber)}/>
        <label>Seed:</label>
        <input type = 'number' defaultValue = {seed} onChange={e => isNaN(e.target.valueAsNumber) ? setseed(0) : setseed(e.target.valueAsNumber)}/>
        <br/>
        <label>Layout:</label>
        <input type = 'radio' id = 'spring' name = 'option' checked={option === "Spring"} onChange={() => setOptionChange('Spring')}/>
        <label htmlFor="spring">Fruchterman-Reingold</label>
        <input type = 'radio' id = 'kamada' name = 'option' checked={option === "Kamada"} onChange={() => setOptionChange('Kamada')}/>
        <label htmlFor="kamada">Kamada-Kawai</label>
        <br/>
        <button onClick={() => downloadRandom()}>Download Generated CSV</button>
      </div>
      <div>
        {DataCsv.length > 0 ?
        <svg style = {{border: '1px solid black'}}viewBox = {[0, 0, width, height]} width = {width} height = {height} ref = {svgRef}>
          <g ref = {lineRef}/>
          <g ref = {circRef}/>
        </svg>
        : null}
      </div>
    </div>
  );
}

export default NetworkGraph;
