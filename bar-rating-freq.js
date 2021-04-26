function main() {
    let xLabels = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
    let svg = d3.select('#bar-rating-freq'),
        margin = {top: 60, bottom: 60, left: 80, right: 160, padding: 5},
        width = svg.attr('width') - margin.left - margin.right,
        height = svg.attr('height') - margin.top - margin.bottom

    let tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)

    let xScale = d3.scaleBand().range([margin.left, margin.left + width]).domain(xLabels).padding(0.45),
        yScale = d3.scaleLinear().range([height + margin.top, margin.top]).domain([0, 3000]),
        colorScale = d3.scaleSequential().interpolator(d3.interpolateYlGn).domain([0, 5])

    d3.csv('appstore_games.csv', d => {
        return {
            rating: +d['Average User Rating']
        }
    }).then(dataset => {
        let data = {}
        let total = 0
        xLabels.forEach(elem => data[elem] = 0)
        dataset.forEach(elem => {
            if (elem.rating > 0) {
                data[elem.rating]++
                total++
            }
        })
        console.log(data)

        function hover(event, d) {
            d3.select(this).transition().duration(300).style('stroke', 'steelblue')
            tooltip.transition().duration(200).style('opacity', 0.9)
            tooltip.html(
                'Average User Rating: ' + d
                + '<br>Frequency: ' + data[d]
                + '<br>Proportion: ' + ~~(data[d] * 100 / total) + '%'
            )
                .style('left', (event.pageX + 20) + 'px')
                .style('top', (event.pageY + 5) + 'px')
        }

        function exit() {
            d3.select(this).transition().duration(300).style('stroke', 'transparent')
            tooltip.transition().duration(600).style('opacity', 0)
        }

        svg.selectAll('rect')
            .data(xLabels)
            .enter()
            .append('rect')
            .attr('x', xl => xScale(xl))
            .attr('y', xl => yScale(data[xl]))
            .attr('width', xScale.bandwidth())
            .attr('height', xl => height + margin.top - yScale(data[xl]))
            .attr('fill', xl => colorScale(+xl))
            .on('mouseover', hover)
            .on('mouseout', exit)

        svg.selectAll('label')
            .data(xLabels)
            .enter()
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('fill', 'black')
            .attr('font-size', 12)
            .attr('font', 'Arial')
            .attr('x', xl => xScale(xl) + xScale.bandwidth() / 2)
            .attr('y', xl => yScale(data[xl]) - margin.padding)
            .text(xl => data[xl])

        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(0, ' + (height + margin.top) + ')')
            .call(d3.axisBottom(xScale).tickValues(xLabels))
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2 + margin.left)
            .attr('y', margin.bottom / 2)
            .text('Average User Rating')

        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + margin.left + ', 0)')
            .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.2s')))
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', - height / 2 - margin.top)
            .attr('y', - margin.left / 2)
            .text('Frequency')

        let legend = d3.legendColor()
            .title('Color Legend')
            .labels(['1', '2', '3', '4', '5'])
            .scale(colorScale)

        svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(' + (width + margin.left + margin.right/5) + ',' + ((height - margin.bottom) / 2) + ')')
            .call(legend)
    })
}

main()
