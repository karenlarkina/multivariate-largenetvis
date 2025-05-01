# Multivariate LargeNetVis

This project presents an improved version of the tool _LargeNetVis_ [[1]](https://github.com/claudiodgl/LargeNetVis), a web-based visual analytics system designed to support experts and practitioners in analyzing small and large temporal networks with multivariate attributes. The enhanced tool adopts an overview-driven approach to better visualize network attributes and facilitates node tracking from both top-down and bottom-up perspectives. This enables users to identify communities within specific timeslices and trace individual nodes across evolving dynamic communities over time.

[//]: # (A proposed improved web-based visual analytics system that assists experts and practitioners in analyzing multivariate small and large temporal networks, i.e., networks varying from a few nodes and timestamps to a few thousand of these elements, where nodes and edges .)



## Video demonstration

Follows a video to demonstrate the Multivariate LargeNetVis system's main functionalities.

[//]: # (Create a new video introducing the system and showing how the tool can be used, should showcase some of the interesting cases from the case study.)

[![Video: Visualizing Communities in Dynamic Multivariate Networks](https://img.youtube.com/vi/8En9Ipw-Z_0/0.jpg)](https://www.youtube.com/watch?v=8En9Ipw-Z_0)

## Software demonstration

Link: http://164.41.76.29:80




## Installation

### Repository

To clone this repo:

```sh
git clone https://github.com/karenlarkina/multivariate-largenetvis.git
cd LargeNetVis
```

### Requirements

With Anaconda installed, you can create a
Conda environment with the dependencies
using:

```sh
conda env create -f webserver/environment.yml
```


## Usage


You can run the system in your machine.

1. Activate the `largenetvis` environment.
```sh
conda activate largenetvis
```

2. Enter the directory `webserver/`:
```sh
cd webserver/
```

3. Run the Flask webserver:

```sh
python app.py
```

4. Visit `http://localhost:5000/` with any web browser.
