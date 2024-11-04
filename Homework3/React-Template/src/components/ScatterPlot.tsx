import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ComponentSize, Margin, VehicleData } from '../types';
import { useDebounceCallback, useResizeObserver } from 'usehooks-ts';


const ScatterPlot: React.FC = () => {
  const svgRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<ScatterData[]>([]);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

  interface ScatterData extends VehicleData {
    profit: number;
  }

  useResizeObserver({ ref: svgRef, onResize });


  useEffect(() => {
    const loadData = async () => {
      try {
        const csvData = await d3.csv('/data/car_prices.csv', d => ({
          year: +d['year'],
          sellingprice: +d['sellingprice'],
          mmr: +d['mmr'],
          profit: +d['sellingprice'] - +d['mmr'],
        }));

        const allData = (csvData as ScatterData[]).filter(
            d => d.year >= 2005 && d.sellingprice > 0 && d.mmr > 0
          );
  
        const halfData = allData.slice(0, allData.length / 2);
        setData(halfData);
      } catch (error) {
        console.error('Error loading CSV file:', error);
      }
    };

    loadData();
  }, []);


  useEffect(() => {
    const margin: Margin = { top: 50, right: 30, bottom: 50, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous SVG content
    d3.select('#scatter-svg').selectAll('*').remove();

    // Create the SVG container
    const svg = d3.select('#scatter-svg')
      .attr('width', size.width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year) as [number, number])
      .range([0, size.width]);

    // Y Scale
    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.profit) as number, d3.max(data, d => d.profit) as number])
      .range([height, 0]);

    // Add the scatter plot points
    svg.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.profit))
      .attr('r', 2)
      .attr('fill', d => d.profit > 0 ? 'green' : 'red');

    // Add X Axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));

    // Add Y Axis
    svg.append('g')
      .call(d3.axisLeft(yScale));

    // Add X label
    svg.append('text')
      .attr('x', size.width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .text('Year');

    // Add Y label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 40)
      .attr('text-anchor', 'middle')
      .text('Profit (Selling Price - MMR)');

    // Add title
    svg.append('text')
      .attr('x', size.width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Profit Over the Manu. Year of Vehicle');
  }, [data, size]);

  return (
    <>
      <div ref={svgRef} className='chart-container'>
        <svg id='scatter-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
};

export default ScatterPlot;
