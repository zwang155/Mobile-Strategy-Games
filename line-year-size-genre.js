function main() {
    let genres = ['Puzzle', 'Action', 'Adventure', 'Family', 'Board']
    let svg = d3.select('#line-year-size-genre'),
        margin = {top: 60, bottom: 60, left: 80, right: 200},
        width = svg.attr('width') - margin.left - margin.right,
        height = svg.attr('height') - margin.top - margin.bottom,
        g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    let parseTime = d3.timeParse('%d/%m/%Y')

    let x = d3.scaleLinear().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        z = d3.scaleOrdinal(d3.schemeCategory10)

    const makeLine = (xScale) => d3.line()
        .curve(d3.curveBasis)
        .x(function (d) {
            return xScale(d.year)
        })
        .y(function (d) {
            return y(d.average)
        })

    let line = d3.line()
        .curve(d3.curveBasis)
        .x(function (d) {
            return x(d.year)
        })
        .y(function (d) {
            return y(d.average)
        })

    d3.csv('appstore_games.csv', function (d) {
        return {
            year: parseTime(d['Original Release Date']).getFullYear(),
            size: +d['Size'],
            genre: d['Genres']
        }
    }).then(function (dataset) {
        let start = d3.min(dataset, d => d.year) + 1,
            end = d3.max(dataset, d => d.year) - 1

        let data = genres.map(function (id) {
            return {
                id: id,
                values: []
            }
        })
        data.forEach(function (elem) {
            for (let i = start; i <= end; i++) {
                elem.values.push({year: i, count: 0, total: 0, average: 0})
            }
        })

        dataset.forEach(elem => {
            if (elem.year >= start && elem.year <= end) {
                genres.forEach(g => {
                    if (elem.genre.includes(g)) {
                        let entry = data.find(a => a.id === g).values.find(v => v.year === elem.year)
                        entry.count++
                        entry.total += elem.size
                    }
                })
            }
        })
        data.forEach(function (elem) {
            elem.values.forEach(d => d.average = d.count > 0 ? d.total / d.count : 0)
        })
        data.sort((a, b) =>
            b.values.find(d => d.year === end).average - a.values.find(d => d.year === end).average)
        console.log(data)

        x.domain([start, end])
        y.domain([
            d3.min(data, d => d3.min(d.values, v => v.average)),
            d3.max(data, d => d3.max(d.values, v => v.average))
        ])

        z.domain(data.map(function (c) {
            return c.id
        }))

        const x_axis = g.append('g')
            .attr('class', 'axis axis--x')
            .attr('id', 'x_axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x))

        g.append('g')
            .attr('class', 'axis axis--y')
            .call(d3.axisLeft(y).tickFormat(d3.format('.2s')))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '0.71em')
            .attr('fill', '#000')
            .text('Size')

        let city = g.selectAll('.city')
            .data(data)
            .enter().append('svg')
            .attr('class', 'city')
            .attr('width', width)


        function hover(elem) {
            let attrs = elem.srcElement.attributes
            let id = attrs['data-id'].value
            let path = city.select('#' + id)
            if (path.attr('visibility') === 'hidden') {
                return
            }
            city.selectAll('.line').style('stroke', 'lightgrey')
            path.style('stroke', z(elem.srcElement.id))
        }

        function exit(elem) {
            city.selectAll('.line').style('stroke', d => {
                return z(d.id)
            })
        }

        function click(elem) {
            let attrs = elem.srcElement.attributes
            let id = attrs['data-id'].value
            let path = city.select('#' + id)
            if (path.attr('visibility') === 'hidden') {
                path.attr('visibility', 'visible')
            } else {
                exit(elem)
                path.attr('visibility', 'hidden')
            }
        }

        const xAxis = (g, x) => g
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0).tickFormat(d3.format('d')))

        function zoomed(event) {
            let xz = event.transform.rescaleX(x)
            x_axis.call(xAxis, xz)
            city.selectAll('.line').attr('d', function (d) {
                return makeLine(xz)(d.values)
            })
        }

        const zoom = d3.zoom()
            .scaleExtent([1, 5])
            .extent([[margin.left, 0], [width, height]])
            .translateExtent([[margin.left, -Infinity], [width, Infinity]])
            .on('zoom', zoomed)

        svg.call(zoom)
            .transition()
            .duration(100)
            .call(zoom.scaleTo, 1, [x(Date.UTC(2012, 1, 1)), 0])


        city.append('path')
            .attr('class', 'line')
            .attr('d', function (d) {
                return line(d.values)
            })
            .attr('id', d => d.id.substring(0, 3).toUpperCase())
            .attr('data-id', d => d.id.substring(0, 3).toUpperCase())
            .attr('visibility', 'visible')
            .style('stroke', function (d) {
                return z(d.id)
            })
            .on('mouseout', exit)

        // svg.selectAll('.label')
        //     .data(data)
        //     .enter()
        //     .append('text')
        //     .datum(function (d) {
        //         return {id: d.id, value: d.values[d.values.length - 1]}
        //     })
        //     .attr('class', 'label')
        //     .attr('transform', function (d) {
        //         return 'translate(' + x(d.value.year) + ',' + y(d.value.average) + ')'
        //     })
        //     .attr('x', 55)
        //     .attr('y', 15)
        //     .attr('dy', '0.35em')
        //     .attr('id', d => d.id)
        //     .attr('data-id', d => d.id.substring(0, 3).toUpperCase())
        //     .style('font', '10px sans-serif')
        //     .text(function (d) {
        //         return d.id
        //     })
        //     .on('click', click)
        //     .on('mouseover', hover)
        //     .on('mouseout', exit)

        let legend = d3.legendColor()
            .title('Color Legend')
            .scale(z)

        svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(' + (width + margin.left + margin.right/5) + ',' + ((height - margin.bottom) / 2) + ')')
            .call(legend)
    })
}

main()
